import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { GoogleMap } from "@/components/google-map";
import {
  buildFarmLocation,
  useGoogleMaps,
  type FarmLocation,
  type GAutocompletePrediction,
  type GoogleMapsApi,
} from "@/lib/google-maps-loader";

type FarmLocationPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  matched: FarmLocation | null;
  onMatched: (location: FarmLocation | null) => void;
  error: string;
  onError: (message: string) => void;
  isChecking: boolean;
  onCheckingChange: (checking: boolean) => void;
  showMap: boolean;
  onShowMapChange: (show: boolean) => void;
  /** Called on Enter when there is no suggestion to pick (validates typed text). */
  onEnterAdvance: () => void;
};

type Suggestion =
  | { source: "google"; placeId: string; main: string; secondary: string; description: string }
  | { source: "osm"; location: FarmLocation; main: string; secondary: string };

// --- Promise wrappers over the callback-based Google Maps services -----------
function predict(api: GoogleMapsApi, input: string): Promise<GAutocompletePrediction[] | null> {
  return new Promise((resolve) => {
    try {
      new api.places.AutocompleteService().getPlacePredictions({ input }, (predictions, status) => {
        resolve(status === "OK" && predictions ? predictions : null);
      });
    } catch {
      resolve(null);
    }
  });
}

function geocode(
  api: GoogleMapsApi,
  request: { placeId?: string; location?: { lat: number; lng: number } },
): Promise<FarmLocation | null> {
  return new Promise((resolve) => {
    try {
      new api.Geocoder().geocode(request, (results, status) => {
        const result = status === "OK" && results ? results[0] : null;
        if (!result) {
          resolve(null);
          return;
        }
        resolve(
          buildFarmLocation({
            placeId: result.place_id,
            formattedAddress: result.formatted_address,
            latitude: result.geometry.location.lat(),
            longitude: result.geometry.location.lng(),
            components: result.address_components,
          }),
        );
      });
    } catch {
      resolve(null);
    }
  });
}

// Farm-location picker: Google Places autocomplete + a draggable Google map marker,
// with the existing OpenStreetMap-backed /api/geocode and /api/reverse-geocode routes
// as always-available fallbacks. The wizard is never blocked: manual typing + Enter
// works even when Google is unavailable.
export function FarmLocationPicker({
  value,
  onValueChange,
  matched,
  onMatched,
  error,
  onError,
  isChecking,
  onCheckingChange,
  showMap,
  onShowMapChange,
  onEnterAdvance,
}: FarmLocationPickerProps) {
  const { state: mapsState, api } = useGoogleMaps();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const listboxId = "farm-location-suggestions";
  const usingGoogleSearch = mapsState === "ready" && Boolean(api);

  // Debounced suggestions: Google predictions when available, otherwise /api/geocode.
  useEffect(() => {
    const query = value.trim();
    if (query.length < 3 || matched) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        if (api) {
          const predictions = await predict(api, query);
          if (predictions && predictions.length > 0) {
            setSuggestions(
              predictions.map((prediction) => ({
                source: "google" as const,
                placeId: prediction.place_id,
                main: prediction.structured_formatting?.main_text ?? prediction.description,
                secondary: prediction.structured_formatting?.secondary_text ?? "",
                description: prediction.description,
              })),
            );
            setShowSuggestions(true);
            return;
          }
          // Google returned nothing / failed → fall through to the server geocoder.
        }
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&suggestions=1`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: FarmLocation[] };
        if (response.ok && !controller.signal.aborted) {
          setSuggestions(
            (data.results ?? []).map((location) => ({
              source: "osm" as const,
              location,
              main: location.display_name.split(",")[0],
              secondary: location.display_name.split(",").slice(1).join(",").trim(),
            })),
          );
          setShowSuggestions(true);
        }
      } catch {
        // Aborted while typing, or a transient network error — safe to ignore.
      } finally {
        if (!controller.signal.aborted) setIsLoadingSuggestions(false);
      }
    }, 550);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, matched, api]);

  const commit = (location: FarmLocation) => {
    onMatched(location);
    onValueChange(location.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    onShowMapChange(true);
    onError("");
  };

  const resolveTypedText = async (query: string) => {
    // Server fallback when a Google place detail lookup fails.
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as { result?: FarmLocation | null; error?: string };
      if (response.ok && data.result) {
        commit(data.result);
        return;
      }
      onError(data.error ?? "We couldn't find that location. Check the spelling and try again.");
    } catch {
      onError("We couldn't check that location. Please try again.");
    }
  };

  const selectSuggestion = async (suggestion: Suggestion) => {
    setShowSuggestions(false);
    onError("");
    if (suggestion.source === "osm") {
      commit(suggestion.location);
      return;
    }
    onCheckingChange(true);
    try {
      const location = api ? await geocode(api, { placeId: suggestion.placeId }) : null;
      if (location) commit(location);
      else await resolveTypedText(suggestion.description);
    } finally {
      onCheckingChange(false);
    }
  };

  const reverseGeocode = async (coords: { lat: number; lng: number }) => {
    onCheckingChange(true);
    onError("");
    setShowSuggestions(false);
    try {
      if (api) {
        const location = await geocode(api, { location: coords });
        if (location) {
          onMatched(location);
          onValueChange(location.display_name);
          return;
        }
      }
      const response = await fetch(
        `/api/reverse-geocode?lat=${encodeURIComponent(String(coords.lat))}&lon=${encodeURIComponent(String(coords.lng))}`,
      );
      const data = (await response.json()) as { result?: FarmLocation; error?: string };
      if (response.ok && data.result) {
        onMatched(data.result);
        onValueChange(data.result.display_name);
      } else {
        onError(data.error ?? "We couldn't identify that map pin. Try another point.");
      }
    } catch {
      onError("We couldn't identify that map pin. Try another point.");
    } finally {
      onCheckingChange(false);
    }
  };

  const center =
    matched?.latitude != null && matched?.longitude != null
      ? { lat: matched.latitude, lng: matched.longitude }
      : matched
        ? { lat: Number(matched.lat), lng: Number(matched.lon) }
        : null;

  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">Address or place</span>
      <div className="relative mt-2">
        <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls={listboxId}
            value={value}
            onFocus={() => {
              if (suggestions.length) setShowSuggestions(true);
            }}
            onChange={(event) => {
              onValueChange(event.target.value);
              onMatched(null);
              onError("");
              setShowSuggestions(true);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              const first = suggestions[0];
              if (first) void selectSuggestion(first);
              else onEnterAdvance();
            }}
            placeholder="e.g. San Francisco, CA"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {(isLoadingSuggestions || isChecking) && (
            <Loader2
              className="h-4 w-4 animate-spin text-primary"
              aria-label="Searching locations"
            />
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Location suggestions"
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-soft)]"
          >
            <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Choose your location
            </p>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.source === "google" ? suggestion.placeId : `osm-${index}`}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void selectSuggestion(suggestion)}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
              >
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {suggestion.main}
                  </span>
                  {suggestion.secondary && (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {suggestion.secondary}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onShowMapChange(!showMap)}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <Navigation className="h-3.5 w-3.5" />
          {showMap ? "Hide map" : "Drop a pin instead"}
        </button>
      </div>

      {showMap && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Set your farm pin</p>
              <p className="text-xs text-muted-foreground">Click the map or drag the marker.</p>
            </div>
            {isChecking && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          <GoogleMap
            center={center}
            zoom={13}
            draggableMarker={center}
            onMapClick={(coords) => void reverseGeocode(coords)}
            onMarkerDragEnd={(coords) => void reverseGeocode(coords)}
            className="w-full"
            height={288}
          />
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {mapsState === "error" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Map search is temporarily unavailable — standard address search is still active.
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {usingGoogleSearch ? (
          "Location search powered by Google"
        ) : (
          <>
            Location search powered by{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              OpenStreetMap
            </a>
          </>
        )}
      </p>
    </label>
  );
}

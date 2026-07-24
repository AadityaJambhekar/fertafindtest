// Google Maps JavaScript API loader + a small typed facade over the subset of the
// API this app uses (Map, Marker, Geocoder, Places AutocompleteService). We load the
// script by injection rather than adding an npm dependency, and we deliberately avoid
// `@types/google.maps` (not installed) by declaring only the surface we touch.
//
// SECURITY: the only key involved is the PUBLIC browser key (VITE_GOOGLE_MAPS_API_KEY),
// which is expected to be HTTP-referrer + API restricted in Google Cloud. No server
// secret is ever read or exposed here.

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Minimal ambient typings for the Google Maps surface we use.
// ---------------------------------------------------------------------------
export interface GLatLngLiteral {
  lat: number;
  lng: number;
}
export interface GLatLng {
  lat(): number;
  lng(): number;
}
export interface GMapMouseEvent {
  latLng?: GLatLng | null;
}
export interface GAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}
export interface GMapOptions {
  center?: GLatLngLiteral;
  zoom?: number;
  mapId?: string;
  disableDefaultUI?: boolean;
  clickableIcons?: boolean;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
  zoomControl?: boolean;
  gestureHandling?: string;
}
export interface GMapEventListener {
  remove(): void;
}
export interface GMap {
  setCenter(c: GLatLngLiteral): void;
  setZoom(z: number): void;
  getZoom(): number;
  panTo(c: GLatLngLiteral): void;
  addListener(evt: string, cb: (e: GMapMouseEvent) => void): GMapEventListener;
}
export interface GMarkerOptions {
  position?: GLatLngLiteral;
  map?: GMap | null;
  draggable?: boolean;
  title?: string;
}
export interface GMarker {
  setPosition(c: GLatLngLiteral): void;
  getPosition(): GLatLng | null;
  setMap(m: GMap | null): void;
  addListener(evt: string, cb: (e: GMapMouseEvent) => void): GMapEventListener;
}
export interface GGeocoderResult {
  formatted_address: string;
  place_id: string;
  address_components: GAddressComponent[];
  geometry: { location: GLatLng };
}
export interface GGeocoder {
  geocode(
    req: { location?: GLatLngLiteral; address?: string; placeId?: string },
    cb: (results: GGeocoderResult[] | null, status: string) => void,
  ): void;
}
export interface GAutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting?: { main_text: string; secondary_text: string };
}
export interface GAutocompleteService {
  getPlacePredictions(
    req: { input: string; types?: string[] },
    cb: (predictions: GAutocompletePrediction[] | null, status: string) => void,
  ): void;
}
export interface GoogleMapsApi {
  Map: new (el: HTMLElement, opts?: GMapOptions) => GMap;
  Marker: new (opts?: GMarkerOptions) => GMarker;
  Geocoder: new () => GGeocoder;
  places: { AutocompleteService: new () => GAutocompleteService };
}

declare global {
  interface Window {
    google?: { maps: GoogleMapsApi };
  }
}

// Load state shared by the reusable <GoogleMap> and the farm-location picker.
export type GoogleMapLoadState = "missing-key" | "loading" | "ready" | "error";

// ---------------------------------------------------------------------------
// Location contract carried through the Analyze wizard. `display_name`/`lat`/`lon`
// are kept (as strings) for backward compatibility with the existing submit()
// payload and the /api/geocode + /api/reverse-geocode fallbacks; the richer
// Google fields ride alongside as optional data.
// ---------------------------------------------------------------------------
export interface FarmLocation {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  placeId?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

function readEnv(name: string): string | undefined {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function getGoogleMapsApiKey(): string | undefined {
  return readEnv("VITE_GOOGLE_MAPS_API_KEY");
}

export function getGoogleMapId(): string | undefined {
  return readEnv("VITE_GOOGLE_MAP_ID");
}

// Build the location contract from a Google geocoder/place result.
export function buildFarmLocation(input: {
  placeId?: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  components?: GAddressComponent[];
}): FarmLocation {
  const components = input.components ?? [];
  const pick = (type: string, short = false): string | undefined => {
    const match = components.find((component) => component.types.includes(type));
    if (!match) return undefined;
    const value = short ? match.short_name : match.long_name;
    return value && value.trim().length > 0 ? value.trim() : undefined;
  };
  const city =
    pick("locality") ??
    pick("postal_town") ??
    pick("sublocality") ??
    pick("administrative_area_level_2");
  return {
    display_name: input.formattedAddress,
    lat: String(input.latitude),
    lon: String(input.longitude),
    placeId: input.placeId,
    formattedAddress: input.formattedAddress,
    latitude: input.latitude,
    longitude: input.longitude,
    city,
    state: pick("administrative_area_level_1"),
    country: pick("country"),
    postalCode: pick("postal_code"),
  };
}

let loadPromise: Promise<void> | null = null;

// Inject the Maps JS API script exactly once. Resolves when google.maps is ready,
// rejects on script error or a 12s timeout. Safe to call repeatedly.
export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const CALLBACK = "__fertafindInitGoogleMaps";
    const globalScope = window as unknown as Record<string, unknown>;
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      loadPromise = null;
      reject(new Error("Google Maps script timed out."));
    }, 12_000);
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (error || !window.google?.maps) {
        loadPromise = null;
        reject(error ?? new Error("Google Maps failed to initialise."));
      } else {
        resolve();
      }
    };

    globalScope[CALLBACK] = () => finish();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-fertafind-gmaps="true"]',
    );
    if (existing) {
      if (window.google?.maps) finish();
      else {
        existing.addEventListener("load", () => finish(), { once: true });
        existing.addEventListener(
          "error",
          () => finish(new Error("Google Maps script failed to load.")),
          {
            once: true,
          },
        );
      }
      return;
    }

    const params = new URLSearchParams({
      key: apiKey,
      libraries: "places",
      v: "weekly",
      loading: "async",
      callback: CALLBACK,
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.fertafindGmaps = "true";
    script.addEventListener(
      "error",
      () => finish(new Error("Google Maps script failed to load.")),
      {
        once: true,
      },
    );
    document.head.appendChild(script);
  });

  return loadPromise;
}

// React hook: resolves the current load state and the API handle once ready.
// Returns "missing-key" (and never loads) when no browser key is configured, so
// callers can degrade gracefully to the server geocoding fallbacks.
export function useGoogleMaps(): { state: GoogleMapLoadState; api: GoogleMapsApi | null } {
  const apiKey = getGoogleMapsApiKey();
  const [state, setState] = useState<GoogleMapLoadState>(() => {
    if (!apiKey) return "missing-key";
    if (typeof window !== "undefined" && window.google?.maps) return "ready";
    return "loading";
  });
  const [api, setApi] = useState<GoogleMapsApi | null>(() =>
    typeof window !== "undefined" ? (window.google?.maps ?? null) : null,
  );

  useEffect(() => {
    if (!apiKey) {
      setState("missing-key");
      return;
    }
    if (typeof window !== "undefined" && window.google?.maps) {
      setApi(window.google.maps);
      setState("ready");
      return;
    }
    let active = true;
    setState("loading");
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!active) return;
        setApi(window.google?.maps ?? null);
        setState(window.google?.maps ? "ready" : "error");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [apiKey]);

  return { state, api };
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CalendarDays,
  Check,
  FileText,
  Loader2,
  MapPin,
  Navigation,
  Sprout,
  Upload,
  X,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { LocationMapPicker } from "@/components/location-map-picker";
import { GoogleRecaptcha, type GoogleRecaptchaHandle } from "@/components/google-recaptcha";
import { analysisStorageKey, type QuoteAnalysis } from "@/lib/quote-analysis";
import { supabase } from "@/integrations/supabase/client";
import {
  getQuoteFileDescriptor,
  MAX_QUOTE_FILES,
  quoteFileError,
  QUOTE_FILE_ACCEPT,
  QUOTE_FILE_HELP_TEXT,
} from "@/lib/quote-files";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze fertilizer quotes — FertaFind" },
      {
        name: "description",
        content:
          "Upload your fertilizer quotes and get an AI-ranked recommendation by ROI, nutrient value and delivery cost.",
      },
    ],
  }),
  component: AnalyzePage,
});

type Step = 0 | 1 | 2 | 3;

type MatchedLocation = {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
};

const CROPS = [
  "Wheat",
  "Corn / Maize",
  "Barley",
  "Canola / Oilseed rape",
  "Soybeans",
  "Rice",
  "Cotton",
  "Sugarcane",
  "Potatoes",
  "Pasture / Forage",
  "Vegetables",
  "Other",
];

function AnalyzePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [location, setLocation] = useState("");
  const [matchedLocation, setMatchedLocation] = useState<MatchedLocation | null>(null);
  const [locationError, setLocationError] = useState("");
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<MatchedLocation[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const radius = 50;
  const [crops, setCrops] = useState<string[]>([]);
  const [fieldSize, setFieldSize] = useState("");
  const [unit, setUnit] = useState<"ha" | "ac">("ha");
  const [plantingDate, setPlantingDate] = useState("");
  const [cropStage, setCropStage] = useState("");
  const [soilTestAvailable, setSoilTestAvailable] = useState(false);
  const [soilTestDate, setSoilTestDate] = useState("");
  const [soilSampleDepthCm, setSoilSampleDepthCm] = useState("");
  const [soilTestMethod, setSoilTestMethod] = useState("");
  const [soilNitrogen, setSoilNitrogen] = useState("");
  const [soilPhosphorus, setSoilPhosphorus] = useState("");
  const [soilPotassium, setSoilPotassium] = useState("");
  const [soilPh, setSoilPh] = useState("");
  const [soilOrganicMatter, setSoilOrganicMatter] = useState("");
  const [soilCec, setSoilCec] = useState("");
  const [soilTexture, setSoilTexture] = useState("");
  const [measuredSoilMoisture, setMeasuredSoilMoisture] = useState("");
  const [measuredSoilTemperature, setMeasuredSoilTemperature] = useState("");
  const [irrigationStatus, setIrrigationStatus] = useState<
    "rain-fed" | "irrigated" | "planned" | ""
  >("");
  const [irrigationMethod, setIrrigationMethod] = useState("");
  const [wateringFrequency, setWateringFrequency] = useState("");
  const [wateringTime, setWateringTime] = useState("");
  const [wateringDurationMinutes, setWateringDurationMinutes] = useState("");
  const [nextWateringDate, setNextWateringDate] = useState("");
  const [growerNotes, setGrowerNotes] = useState("");
  const [targetNitrogenKgHa, setTargetNitrogenKgHa] = useState("");
  const [targetPhosphorusKgHa, setTargetPhosphorusKgHa] = useState("");
  const [targetPotassiumKgHa, setTargetPotassiumKgHa] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [analysisError, setAnalysisError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const recaptchaRef = useRef<GoogleRecaptchaHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      setAuthChecked(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authChecked && !signedIn) {
      void navigate({ to: "/account", replace: true });
    }
  }, [authChecked, navigate, signedIn]);

  const canNext =
    (step === 0 && location.trim().length > 2) ||
    (step === 1 && crops.length > 0 && Number(fieldSize) > 0 && irrigationStatus !== "") ||
    (step === 2 && photos.length > 0);

  const handleFiles = useCallback((fileList: File[] | FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    if (!incoming.length) return;

    const errors = incoming.map(quoteFileError).filter(Boolean);
    const accepted = incoming.filter((file) => !quoteFileError(file));

    setPhotos((prev) => {
      const existingKeys = new Set(
        prev.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
      );
      const uniqueIncoming = accepted.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      const slotsLeft = Math.max(MAX_QUOTE_FILES - prev.length, 0);
      const next = [...prev, ...uniqueIncoming.slice(0, slotsLeft)];

      const messages = [...errors];
      if (uniqueIncoming.length > slotsLeft) {
        messages.push(`Only ${MAX_QUOTE_FILES} quote files can be analyzed at once.`);
      }
      setAnalysisError(messages[0] ?? "");

      return next;
    });
  }, []);

  useEffect(() => {
    if (step !== 2) return;

    const handlePaste = (event: ClipboardEvent) => {
      const files = event.clipboardData?.files;
      if (files?.length) {
        event.preventDefault();
        handleFiles(files);
        return;
      }

      const text = event.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;
      event.preventDefault();
      handleFiles([
        new File([text], `pasted-quote-${Date.now()}.txt`, {
          type: "text/plain",
          lastModified: Date.now(),
        }),
      ]);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFiles, step]);

  useEffect(() => {
    const query = location.trim();
    if (step !== 0 || query.length < 3 || matchedLocation) {
      setLocationSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&suggestions=1`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: MatchedLocation[] };
        if (response.ok && !controller.signal.aborted) {
          setLocationSuggestions(data.results ?? []);
          setShowSuggestions(true);
        }
      } catch {
        // A suggestion request being cancelled while the user types is expected.
      } finally {
        if (!controller.signal.aborted) setIsLoadingSuggestions(false);
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [location, matchedLocation, step]);

  const selectLocation = (selectedLocation: MatchedLocation) => {
    setLocation(selectedLocation.display_name);
    setMatchedLocation(selectedLocation);
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setShowMapPicker(true);
    setLocationError("");
  };

  const validateLocation = async () => {
    const normalizedQuery = location.trim();
    if (normalizedQuery.length < 3 || isCheckingLocation) return;

    if (matchedLocation) {
      setStep(1);
      return;
    }

    setIsCheckingLocation(true);
    setLocationError("");

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(normalizedQuery)}`);
      const data = (await response.json()) as {
        result?: MatchedLocation | null;
        error?: string;
      };

      if (!response.ok || !data.result) {
        setMatchedLocation(null);
        setLocationError(
          data.error ?? "We couldn't find that location. Check the spelling and try again.",
        );
        return;
      }

      setMatchedLocation(data.result);
      setLocation(data.result.display_name);
      setStep(1);
    } catch {
      setMatchedLocation(null);
      setLocationError("We couldn't check that location. Please try again.");
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const handleMapPinDrop = useCallback(async (coordinates: { lat: number; lon: number }) => {
    setIsCheckingLocation(true);
    setLocationError("");
    setShowSuggestions(false);
    try {
      const response = await fetch(
        `/api/reverse-geocode?lat=${encodeURIComponent(String(coordinates.lat))}&lon=${encodeURIComponent(String(coordinates.lon))}`,
      );
      const data = (await response.json()) as { result?: MatchedLocation; error?: string };
      if (!response.ok || !data.result) {
        setLocationError(data.error ?? "We couldn't identify that map pin. Try another point.");
        return;
      }

      setMatchedLocation(data.result);
      setLocation(data.result.display_name);
      setLocationSuggestions([]);
    } catch {
      setLocationError("We couldn't identify that map pin. Try another point.");
    } finally {
      setIsCheckingLocation(false);
    }
  }, []);

  const submit = useCallback(
    async (recaptchaToken: string) => {
      if (!matchedLocation) {
        setAnalysisError("Go back and verify the farm location first.");
        setIsVerifying(false);
        return;
      }
      setStep(3);
      setAnalysisError("");

      const form = new FormData();
      form.set("location", matchedLocation.display_name);
      form.set("lat", matchedLocation.lat);
      form.set("lon", matchedLocation.lon);
      form.set("radiusKm", String(radius));
      form.set("crop", crops.join(", "));
      form.set("fieldSize", fieldSize);
      form.set("unit", unit);
      form.set("plantingDate", plantingDate);
      form.set("cropStage", cropStage);
      form.set("soilTestAvailable", String(soilTestAvailable));
      form.set("soilTestDate", soilTestDate);
      form.set("soilSampleDepthCm", soilSampleDepthCm);
      form.set("soilTestMethod", soilTestMethod);
      form.set("soilNitrogen", soilNitrogen);
      form.set("soilPhosphorus", soilPhosphorus);
      form.set("soilPotassium", soilPotassium);
      form.set("soilPh", soilPh);
      form.set("soilOrganicMatter", soilOrganicMatter);
      form.set("soilCec", soilCec);
      form.set("soilTexture", soilTexture);
      form.set("measuredSoilMoisture", measuredSoilMoisture);
      form.set("measuredSoilTemperature", measuredSoilTemperature);
      form.set("irrigationStatus", irrigationStatus);
      form.set("irrigationMethod", irrigationMethod);
      form.set("wateringFrequency", wateringFrequency);
      form.set("wateringTime", wateringTime);
      form.set("wateringDurationMinutes", wateringDurationMinutes);
      form.set("nextWateringDate", nextWateringDate);
      form.set("growerNotes", growerNotes);
      form.set("targetNitrogenKgHa", targetNitrogenKgHa);
      form.set("targetPhosphorusKgHa", targetPhosphorusKgHa);
      form.set("targetPotassiumKgHa", targetPotassiumKgHa);
      form.set("recaptchaToken", recaptchaToken);
      photos.forEach((photo) => form.append("quotes", photo));

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error("Sign in before analyzing quotes.");
        const response = await fetch("/api/analyze-quotes", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        });
        const data = (await response.json()) as {
          analysis?: QuoteAnalysis;
          error?: string;
        };
        if (!response.ok || !data.analysis) {
          throw new Error(data.error || "The quote analysis failed.");
        }

        localStorage.setItem(analysisStorageKey(data.analysis.id), JSON.stringify(data.analysis));
        // Saving is optional: guest analyses remain private in this browser, while signed-in
        // growers get a secure history under their own account.
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            // Generated Supabase types have not yet been refreshed after the account migrations.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const db = supabase as any;
            await db.from("analyses").upsert({
              id: data.analysis.id,
              owner_id: sessionData.session.user.id,
              payload: data.analysis,
            });
          }
        } catch {
          // A configured account service is never allowed to block an otherwise completed quote analysis.
        }
        navigate({ to: "/results/$id", params: { id: data.analysis.id } });
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : "The quote analysis failed.");
        recaptchaRef.current?.reset();
        setStep(2);
      } finally {
        setIsVerifying(false);
      }
    },
    [
      crops,
      cropStage,
      fieldSize,
      growerNotes,
      irrigationMethod,
      irrigationStatus,
      matchedLocation,
      measuredSoilMoisture,
      measuredSoilTemperature,
      navigate,
      nextWateringDate,
      photos,
      plantingDate,
      soilCec,
      soilNitrogen,
      soilOrganicMatter,
      soilPh,
      soilPhosphorus,
      soilPotassium,
      soilSampleDepthCm,
      soilTestAvailable,
      soilTestDate,
      soilTestMethod,
      soilTexture,
      targetNitrogenKgHa,
      targetPhosphorusKgHa,
      targetPotassiumKgHa,
      unit,
      wateringDurationMinutes,
      wateringFrequency,
      wateringTime,
    ],
  );

  const handleVerified = useCallback(
    (token: string) => {
      void submit(token);
    },
    [submit],
  );

  const handleVerificationError = useCallback((message: string) => {
    setAnalysisError(message);
    setIsVerifying(false);
  }, []);

  const beginAnalysis = () => {
    setAnalysisError("");
    setIsVerifying(true);
    if (!recaptchaRef.current?.execute()) {
      setAnalysisError("Verification is still loading. Try again in a moment.");
      setIsVerifying(false);
    }
  };

  if (!authChecked || !signedIn) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <StepIndicator step={step} />

        <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10">
          {step === 0 && (
            <StepShell
              title="Where's your farm?"
              subtitle="We'll only compare suppliers who deliver to you."
            >
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Farm address, town or postcode
                </span>
                <div className="relative mt-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <input
                      autoFocus
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={showSuggestions && locationSuggestions.length > 0}
                      aria-controls="location-suggestions"
                      value={location}
                      onFocus={() => {
                        if (locationSuggestions.length) setShowSuggestions(true);
                      }}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setMatchedLocation(null);
                        setLocationError("");
                        setShowSuggestions(true);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();

                        const firstSuggestion = locationSuggestions[0];
                        if (firstSuggestion) {
                          selectLocation(firstSuggestion);
                          return;
                        }

                        void validateLocation();
                      }}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                    {isLoadingSuggestions && (
                      <Loader2
                        className="h-4 w-4 animate-spin text-primary"
                        aria-label="Searching locations"
                      />
                    )}
                  </div>
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div
                      id="location-suggestions"
                      role="listbox"
                      aria-label="Location suggestions"
                      className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-soft)]"
                    >
                      <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Choose your location
                      </p>
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.lat}-${suggestion.lon}`}
                          type="button"
                          role="option"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectLocation(suggestion)}
                          className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                        >
                          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            <MapPin className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {suggestion.display_name.split(",")[0]}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {suggestion.display_name.split(",").slice(1).join(",").trim()}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMapPicker((visible) => !visible)}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    {showMapPicker ? "Hide map" : "Drop a pin instead"}
                  </button>
                </div>
                {showMapPicker && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Set your farm pin</p>
                        <p className="text-xs text-muted-foreground">
                          Click the map or drag the green marker.
                        </p>
                      </div>
                      {isCheckingLocation && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                    </div>
                    <LocationMapPicker
                      center={
                        matchedLocation
                          ? { lat: Number(matchedLocation.lat), lon: Number(matchedLocation.lon) }
                          : null
                      }
                      onPinDrop={handleMapPinDrop}
                    />
                  </div>
                )}
                {locationError && (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {locationError}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Location search powered by{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    OpenStreetMap
                  </a>
                </p>
              </label>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell
              title="What are you growing?"
              subtitle="Select all that apply. We tune the recommendation to each crop's nutrient priorities."
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Multiple selections allowed
                </p>
                {crops.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCrops([])}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Clear {crops.length} selected
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {CROPS.map((c) => {
                  const selected = crops.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setCrops((current) =>
                          selected ? current.filter((item) => item !== c) : [...current, c],
                        )
                      }
                      className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-all ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                          : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/50"
                      }`}
                    >
                      <span>{c}</span>
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${selected ? "border-primary-foreground/40 bg-primary-foreground text-primary" : "border-border text-transparent"}`}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Field size</span>
                  <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                    <Sprout className="h-5 w-5 text-muted-foreground" />
                    <input
                      type="number"
                      min={0}
                      value={fieldSize}
                      onChange={(e) => setFieldSize(e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                  </div>
                </label>
                <div className="min-w-40">
                  <span className="block text-sm font-medium text-foreground">Unit</span>
                  <div className="mt-2 grid h-[50px] grid-cols-2 gap-1 rounded-2xl border border-input bg-muted/60 p-1">
                    {(["ha", "ac"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        aria-pressed={unit === u}
                        className={`min-w-16 rounded-xl px-4 text-sm font-semibold transition-all ${
                          unit === u
                            ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                            : "text-muted-foreground hover:bg-background hover:text-foreground"
                        }`}
                      >
                        {u === "ha" ? "Hectares" : "Acres"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 space-y-5">
                <section className="rounded-2xl border border-border bg-muted/35 p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="font-semibold text-foreground">Growing conditions</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Optional details improve crop-stage and application-timing guidance.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Planting date</span>
                      <input
                        type="date"
                        value={plantingDate}
                        onChange={(event) => setPlantingDate(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </label>
                    <ConditionInput
                      label="Crop stage"
                      value={cropStage}
                      onChange={setCropStage}
                      placeholder="e.g. early vegetative, flowering"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-foreground">Laboratory soil test</h2>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                          Optional · recommended
                        </span>
                      </div>
                      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                        Use values from a recent lab report. Test method and sample depth matter, so
                        include them when shown.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={soilTestAvailable}
                        onChange={(event) => setSoilTestAvailable(event.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      I have a soil test
                    </label>
                  </div>
                  {soilTestAvailable ? (
                    <div className="mt-5 space-y-5 border-t border-primary/15 pt-5">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <label className="block">
                          <span className="text-sm font-medium text-foreground">Test date</span>
                          <input
                            type="date"
                            value={soilTestDate}
                            onChange={(event) => setSoilTestDate(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                          />
                        </label>
                        <ConditionInput
                          label="Sample depth (cm)"
                          value={soilSampleDepthCm}
                          onChange={setSoilSampleDepthCm}
                          placeholder="e.g. 0–15"
                        />
                        <ConditionInput
                          label="Lab / extraction method"
                          value={soilTestMethod}
                          onChange={setSoilTestMethod}
                          placeholder="e.g. Olsen P, Mehlich-3"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <ConditionInput
                          label="Nitrate-N"
                          value={soilNitrogen}
                          onChange={setSoilNitrogen}
                          placeholder="value + unit"
                        />
                        <ConditionInput
                          label="Available P"
                          value={soilPhosphorus}
                          onChange={setSoilPhosphorus}
                          placeholder="value + unit"
                        />
                        <ConditionInput
                          label="Exchangeable K"
                          value={soilPotassium}
                          onChange={setSoilPotassium}
                          placeholder="value + unit"
                        />
                        <ConditionInput
                          label="Soil pH"
                          value={soilPh}
                          onChange={setSoilPh}
                          placeholder="e.g. 6.4"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <ConditionInput
                          label="Organic matter (%)"
                          value={soilOrganicMatter}
                          onChange={setSoilOrganicMatter}
                          placeholder="e.g. 3.2"
                        />
                        <ConditionInput
                          label="CEC"
                          value={soilCec}
                          onChange={setSoilCec}
                          placeholder="e.g. 14 cmol(+)/kg"
                        />
                        <ConditionInput
                          label="Soil texture"
                          value={soilTexture}
                          onChange={setSoilTexture}
                          placeholder="e.g. sandy loam"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl bg-background px-4 py-3 text-sm text-muted-foreground">
                      You can continue without a soil test. The result will clearly flag that
                      nutrient fit is less certain.
                    </p>
                  )}
                </section>

                <section className="rounded-2xl border border-border bg-muted/35 p-5">
                  <h2 className="font-semibold text-foreground">Water and soil conditions</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Required: tell us whether rainfall or irrigation will move nutrients into the
                    root zone.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        ["rain-fed", "Rain-fed only"],
                        ["irrigated", "I irrigate"],
                        ["planned", "I plan to irrigate"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setIrrigationStatus(value)}
                        aria-pressed={irrigationStatus === value}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${irrigationStatus === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {irrigationStatus && irrigationStatus !== "rain-fed" && (
                    <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
                      <ConditionInput
                        label="Irrigation method"
                        value={irrigationMethod}
                        onChange={setIrrigationMethod}
                        placeholder="e.g. drip, sprinkler, flood"
                      />
                      <ConditionInput
                        label="Watering frequency"
                        value={wateringFrequency}
                        onChange={setWateringFrequency}
                        placeholder="e.g. every 3 days"
                      />
                      <ConditionInput
                        label="Typical watering time"
                        value={wateringTime}
                        onChange={setWateringTime}
                        placeholder="e.g. 6:00 AM"
                      />
                      <ConditionInput
                        label="Duration per watering"
                        value={wateringDurationMinutes}
                        onChange={setWateringDurationMinutes}
                        placeholder="e.g. 45 minutes"
                      />
                      <label className="block">
                        <span className="text-sm font-medium text-foreground">
                          Next watering date
                        </span>
                        <input
                          type="date"
                          value={nextWateringDate}
                          onChange={(event) => setNextWateringDate(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                      </label>
                    </div>
                  )}
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <ConditionInput
                      label="Measured soil moisture (optional)"
                      value={measuredSoilMoisture}
                      onChange={setMeasuredSoilMoisture}
                      placeholder="e.g. 24% VWC or dry"
                    />
                    <ConditionInput
                      label="Measured soil temperature (optional)"
                      value={measuredSoilTemperature}
                      onChange={setMeasuredSoilTemperature}
                      placeholder="e.g. 18°C at 10 cm"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-muted/35 p-5">
                  <h3 className="font-semibold text-foreground">
                    Target nutrient plan{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use targets from a qualified agronomist or nutrient plan. These values directly
                    affect the ranking.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <ConditionInput
                      label="Target N (kg/ha)"
                      value={targetNitrogenKgHa}
                      onChange={setTargetNitrogenKgHa}
                      placeholder="e.g. 110"
                    />
                    <ConditionInput
                      label="Target P (kg/ha)"
                      value={targetPhosphorusKgHa}
                      onChange={setTargetPhosphorusKgHa}
                      placeholder="e.g. 35"
                    />
                    <ConditionInput
                      label="Target K (kg/ha)"
                      value={targetPotassiumKgHa}
                      onChange={setTargetPotassiumKgHa}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <label className="mt-5 block">
                    <span className="text-sm font-medium text-foreground">
                      Anything else to consider
                    </span>
                    <input
                      value={growerNotes}
                      onChange={(event) => setGrowerNotes(event.target.value)}
                      placeholder="e.g. drainage issue, recent manure application"
                      className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </label>
                </section>
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              title="Upload your fertilizer quotes"
              subtitle="Add quote photos, documents or copied quote text. Our AI will extract the details."
            >
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={QUOTE_FILE_ACCEPT}
                  multiple
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                    setIsDragging(true);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setIsDragging(false);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    handleFiles(event.dataTransfer.files);
                  }}
                  className={`grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all ${
                    isDragging
                      ? "border-primary bg-primary/15 shadow-[0_24px_70px_rgba(23,138,69,0.18)]"
                      : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-4 font-display text-lg font-semibold text-foreground">
                    Drop, tap, or paste quotes here
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{QUOTE_FILE_HELP_TEXT}</p>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((f, i) => (
                    <div
                      key={i}
                      className="group relative rounded-2xl border border-border bg-background p-3"
                    >
                      <div className="flex items-center gap-2">
                        {getQuoteFileDescriptor(f)?.kind === "image" ? (
                          <Camera className="h-4 w-4 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                        <span className="truncate text-xs font-medium text-foreground">
                          {f.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {analysisError && (
                <p className="mt-4 text-sm text-destructive" role="alert">
                  {analysisError}
                </p>
              )}
              <GoogleRecaptcha
                ref={recaptchaRef}
                onVerified={handleVerified}
                onError={handleVerificationError}
              />
            </StepShell>
          )}

          {step === 3 && (
            <div className="py-16 text-center">
              <div className="mx-auto grid h-16 w-16 animate-pulse place-items-center rounded-2xl bg-primary text-primary-foreground">
                <Sprout className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">
                Analyzing your quotes…
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Extracting nutrient values, comparing suppliers in your area, and calculating ROI.
              </p>
            </div>
          )}

          {step !== 3 && (
            <div className="mt-10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}
                disabled={step === 0}
                className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              {step < 2 ? (
                <button
                  type="button"
                  disabled={!canNext || isCheckingLocation}
                  onClick={() => {
                    if (step === 0) void validateLocation();
                    else setStep((s) => (s + 1) as Step);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {step === 0 && isCheckingLocation ? "Checking…" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canNext || isVerifying}
                  onClick={beginAnalysis}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {isVerifying ? "Checking…" : "Analyze"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function ConditionInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const labels = ["Location", "Crop", "Quotes"];
  return (
    <ol className="flex items-center gap-3">
      {labels.map((label, i) => {
        const done = step > i || step === 3;
        const active = step === i;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-colors ${
                done
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "border-2 border-primary bg-background text-primary"
                    : "border border-border bg-background text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={`text-sm ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {label}
            </span>
            {i < labels.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}

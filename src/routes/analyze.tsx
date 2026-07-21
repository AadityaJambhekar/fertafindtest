import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CircleDollarSign,
  Check,
  FileText,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Scale,
  Sprout,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { LocationMapPicker } from "@/components/location-map-picker";
import { GoogleRecaptcha, type GoogleRecaptchaHandle } from "@/components/google-recaptcha";
import { catalogSupportsCrop } from "@/lib/partner-catalog";
import {
  analysisStorageKey,
  type PriorFertilizerApplication,
  type QuoteAnalysis,
} from "@/lib/quote-analysis";
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
    links: [{ rel: "canonical", href: "https://fertafind.com/analyze/" }],
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

type SoilTestExtraction = {
  soilTestDate: string;
  soilSampleDepthCm: string;
  soilTestMethod: string;
  soilNitrogen: string;
  soilPhosphorus: string;
  soilPotassium: string;
  soilSulfur: string;
  soilPh: string;
  soilOrganicMatter: string;
  soilCec: string;
  soilTexture: string;
  soilMicronutrients: Record<string, string>;
  warnings: string[];
};

const MICRONUTRIENT_FIELDS = [
  { key: "zinc", label: "Zinc (Zn)", unit: "ppm", placeholder: "e.g. 1.2" },
] as const;

type PriorApplicationDraft = PriorFertilizerApplication & { id: string };

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
  "Beans",
  "Lettuce",
  "Tomatoes",
  "Peppers",
  "Cassava",
  "Grapes",
  "Vegetables",
  "Other",
];

const CROP_STAGES: Record<string, string[]> = {
  Wheat: [
    "Establishment",
    "Tillering",
    "Stem elongation",
    "Booting / heading",
    "Grain filling",
    "Maturity",
  ],
  "Corn / Maize": ["Pre-plant", "VE–V5", "V6–V7", "V8–VT", "R1–R3", "R4–R6"],
  Barley: [
    "Establishment",
    "Tillering",
    "Stem elongation",
    "Booting / heading",
    "Grain filling",
    "Maturity",
  ],
  "Canola / Oilseed rape": [
    "Establishment",
    "Rosette",
    "Stem elongation",
    "Bud / flowering",
    "Pod filling",
    "Maturity",
  ],
  Soybeans: ["Pre-plant", "VE–V5", "V6–Vn", "R1–R2", "R3–R4", "R5–R8"],
  Rice: [
    "Establishment",
    "Tillering",
    "Panicle initiation",
    "Heading / flowering",
    "Grain filling",
    "Maturity",
  ],
  Cotton: ["Establishment", "Squaring", "Flowering", "Boll development", "Maturity"],
  Sugarcane: ["Planting / establishment", "Tillering", "Grand growth", "Maturation"],
  Potatoes: [
    "Planting / emergence",
    "Vegetative",
    "Tuber initiation",
    "Tuber bulking",
    "Maturation",
  ],
  "Pasture / Forage": [
    "Establishment",
    "Active vegetative growth",
    "Pre-grazing / cutting",
    "Recovery",
    "Dormant",
  ],
  Beans: ["Pre-plant", "VE–V2", "V3–Vn", "Flowering", "Pod formation", "Grain filling", "Maturity"],
  Lettuce: [
    "Transplant / establishment",
    "Vegetative growth",
    "Head formation / filling",
    "Harvest",
  ],
  Tomatoes: [
    "Transplant / establishment",
    "Vegetative growth",
    "Flowering",
    "Fruit set",
    "Fruit growth",
    "Maturation / harvest",
  ],
  Peppers: [
    "Transplant / establishment",
    "Vegetative growth",
    "Flowering",
    "Fruit set",
    "Fruit growth",
    "Maturation / harvest",
  ],
  Cassava: ["Establishment", "Vegetative growth", "Tuber initiation", "Root bulking", "Maturity"],
  Grapes: [
    "Bud break",
    "Pre-flowering / flowering",
    "Fruit set",
    "Berry growth",
    "Maturation",
    "Post-harvest",
  ],
  Vegetables: ["Establishment", "Vegetative", "Flowering", "Fruit / root development", "Harvest"],
  Other: ["Pre-plant", "Establishment", "Vegetative", "Reproductive", "Maturity"],
};

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
  const [decisionGoal, setDecisionGoal] = useState<"yield" | "cost" | "balanced" | "">("");
  const [fertilizerFormPreference, setFertilizerFormPreference] = useState<
    "liquid" | "dry" | "either" | ""
  >("");
  const [fertilizerOriginPreference, setFertilizerOriginPreference] = useState<
    "organic" | "synthetic" | "either" | ""
  >("");
  const [organicCertification, setOrganicCertification] = useState<
    "certified" | "not_certified" | ""
  >("");
  const [fieldSize, setFieldSize] = useState("");
  const [unit, setUnit] = useState<"ha" | "ac">("ha");
  const [cropStages, setCropStages] = useState<Record<string, string>>({});
  const [soilTestAvailable, setSoilTestAvailable] = useState(false);
  const [soilTestDate, setSoilTestDate] = useState("");
  const [soilSampleDepthCm, setSoilSampleDepthCm] = useState("");
  const [soilTestMethod, setSoilTestMethod] = useState("");
  const [soilNitrogen, setSoilNitrogen] = useState("");
  const [soilPhosphorus, setSoilPhosphorus] = useState("");
  const [soilPotassium, setSoilPotassium] = useState("");
  const [soilSulfur, setSoilSulfur] = useState("");
  const [soilPh, setSoilPh] = useState("");
  const [soilOrganicMatter, setSoilOrganicMatter] = useState("");
  const [soilCec, setSoilCec] = useState("");
  const [soilTexture, setSoilTexture] = useState("");
  const [soilMicronutrients, setSoilMicronutrients] = useState<Record<string, string>>({
    zinc: "",
  });
  const [soilTestFile, setSoilTestFile] = useState<File | null>(null);
  const [isReadingSoilTest, setIsReadingSoilTest] = useState(false);
  const [soilTestReadError, setSoilTestReadError] = useState("");
  const [soilTestReadWarnings, setSoilTestReadWarnings] = useState<string[]>([]);
  const [priorFertilizerApplied, setPriorFertilizerApplied] = useState<"yes" | "no" | "">("");
  const [priorFertilizerApplications, setPriorFertilizerApplications] = useState<
    PriorApplicationDraft[]
  >([]);
  const [measuredSoilMoisture, setMeasuredSoilMoisture] = useState("");
  const [measuredSoilTemperature, setMeasuredSoilTemperature] = useState("");
  const [irrigationStatus, setIrrigationStatus] = useState<
    "rain-fed" | "irrigated" | "planned" | ""
  >("");
  const [irrigationMethod, setIrrigationMethod] = useState("");
  const [wateringFrequency, setWateringFrequency] = useState("");
  const [nextWateringDate, setNextWateringDate] = useState("");
  const [growerNotes, setGrowerNotes] = useState("");
  const [targetNitrogenKgHa, setTargetNitrogenKgHa] = useState("");
  const [targetPhosphorusKgHa, setTargetPhosphorusKgHa] = useState("");
  const [targetPotassiumKgHa, setTargetPotassiumKgHa] = useState("");
  const [targetSulfurKgHa, setTargetSulfurKgHa] = useState("");
  const [priorityNutrients, setPriorityNutrients] = useState<Array<"N" | "P" | "K" | "Zn">>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [analysisError, setAnalysisError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const recaptchaRef = useRef<GoogleRecaptchaHandle>(null);
  const soilRecaptchaRef = useRef<GoogleRecaptchaHandle>(null);
  const pendingSoilTestFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canNext =
    (step === 0 && location.trim().length > 2) ||
    (step === 1 &&
      crops.length > 0 &&
      decisionGoal !== "" &&
      fertilizerFormPreference !== "" &&
      fertilizerOriginPreference !== "" &&
      (fertilizerOriginPreference !== "organic" || organicCertification !== "") &&
      Number(fieldSize) > 0 &&
      irrigationStatus !== "" &&
      crops.every((crop) => Boolean(cropStages[crop]))) ||
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

  const readSoilTest = useCallback(async (token: string) => {
    const file = pendingSoilTestFileRef.current;
    if (!file) return;

    const form = new FormData();
    form.set("soilTest", file);
    form.set("recaptchaToken", token);
    try {
      const response = await fetch("/api/extract-soil-test", { method: "POST", body: form });
      const data = (await response.json()) as { values?: SoilTestExtraction; error?: string };
      if (!response.ok || !data.values)
        throw new Error(data.error || "The soil test could not be read.");

      const values = data.values;
      if (values.soilTestDate) setSoilTestDate(values.soilTestDate);
      if (values.soilSampleDepthCm) setSoilSampleDepthCm(values.soilSampleDepthCm);
      if (values.soilTestMethod) setSoilTestMethod(values.soilTestMethod);
      if (values.soilNitrogen) setSoilNitrogen(values.soilNitrogen);
      if (values.soilPhosphorus) setSoilPhosphorus(values.soilPhosphorus);
      if (values.soilPotassium) setSoilPotassium(values.soilPotassium);
      if (values.soilSulfur) setSoilSulfur(values.soilSulfur);
      if (values.soilPh) setSoilPh(values.soilPh);
      if (values.soilOrganicMatter) setSoilOrganicMatter(values.soilOrganicMatter);
      if (values.soilCec) setSoilCec(values.soilCec);
      if (values.soilTexture) setSoilTexture(values.soilTexture);
      if (values.soilMicronutrients) {
        setSoilMicronutrients((current) => ({ ...current, ...values.soilMicronutrients }));
      }
      setSoilTestReadWarnings(values.warnings ?? []);
    } catch (error) {
      setSoilTestReadError(
        error instanceof Error ? error.message : "The soil test could not be read.",
      );
      soilRecaptchaRef.current?.reset();
    } finally {
      pendingSoilTestFileRef.current = null;
      setIsReadingSoilTest(false);
    }
  }, []);

  const handleSoilTestFile = (file: File | null) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setSoilTestReadError("Use a JPG, PNG, WebP or PDF soil report under 10 MB.");
      return;
    }
    setSoilTestFile(file);
    setSoilTestAvailable(true);
    setSoilTestReadError("");
    setSoilTestReadWarnings([]);
    setIsReadingSoilTest(true);
    pendingSoilTestFileRef.current = file;
    if (!soilRecaptchaRef.current?.execute()) {
      setSoilTestReadError("Verification is still loading. Try the report again in a moment.");
      pendingSoilTestFileRef.current = null;
      setIsReadingSoilTest(false);
    }
  };

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
      form.set("decisionGoal", decisionGoal);
      form.set("fertilizerFormPreference", fertilizerFormPreference);
      form.set("fertilizerOriginPreference", fertilizerOriginPreference);
      form.set("organicCertification", organicCertification);
      form.set("fieldSize", fieldSize);
      form.set("unit", unit);
      form.set(
        "cropStage",
        crops.map((crop) => `${crop}: ${cropStages[crop] || "Not sure"}`).join("; "),
      );
      form.set("soilTestAvailable", String(soilTestAvailable));
      form.set("soilTestDate", soilTestDate);
      form.set("soilSampleDepthCm", soilSampleDepthCm);
      form.set("soilTestMethod", soilTestMethod);
      form.set("soilNitrogen", soilNitrogen);
      form.set("soilPhosphorus", soilPhosphorus);
      form.set("soilPotassium", soilPotassium);
      form.set("soilSulfur", soilSulfur);
      form.set("soilPh", soilPh);
      form.set("soilOrganicMatter", soilOrganicMatter);
      form.set("soilCec", soilCec);
      form.set("soilTexture", soilTexture);
      form.set("soilMicronutrients", JSON.stringify(soilMicronutrients));
      form.set("priorFertilizerApplied", priorFertilizerApplied);
      form.set(
        "priorFertilizerApplications",
        JSON.stringify(
          priorFertilizerApplied === "yes"
            ? priorFertilizerApplications.map(
                ({ applicationDate, productAnalysis, quantity, unit }) => ({
                  applicationDate,
                  productAnalysis,
                  quantity,
                  unit,
                }),
              )
            : [],
        ),
      );
      form.set("measuredSoilMoisture", measuredSoilMoisture);
      form.set("measuredSoilTemperature", measuredSoilTemperature);
      form.set("irrigationStatus", irrigationStatus);
      form.set("irrigationMethod", irrigationMethod);
      form.set("wateringFrequency", wateringFrequency);
      form.set("nextWateringDate", nextWateringDate);
      form.set("growerNotes", growerNotes);
      form.set("targetNitrogenKgHa", targetNitrogenKgHa);
      form.set("targetPhosphorusKgHa", targetPhosphorusKgHa);
      form.set("targetPotassiumKgHa", targetPotassiumKgHa);
      form.set("targetSulfurKgHa", targetSulfurKgHa);
      form.set("priorityNutrients", priorityNutrients.join(","));
      form.set("recaptchaToken", recaptchaToken);
      photos.forEach((photo) => form.append("quotes", photo, photo.name));

      try {
        const response = await fetch("/api/analyze-quotes", {
          method: "POST",
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
      cropStages,
      decisionGoal,
      fertilizerFormPreference,
      fertilizerOriginPreference,
      fieldSize,
      growerNotes,
      irrigationMethod,
      irrigationStatus,
      matchedLocation,
      measuredSoilMoisture,
      measuredSoilTemperature,
      navigate,
      nextWateringDate,
      organicCertification,
      photos,
      priorFertilizerApplications,
      priorFertilizerApplied,
      priorityNutrients,
      soilCec,
      soilNitrogen,
      soilOrganicMatter,
      soilPh,
      soilPhosphorus,
      soilPotassium,
      soilSulfur,
      soilSampleDepthCm,
      soilTestAvailable,
      soilTestDate,
      soilTestMethod,
      soilMicronutrients,
      soilTexture,
      targetNitrogenKgHa,
      targetPhosphorusKgHa,
      targetPotassiumKgHa,
      targetSulfurKgHa,
      unit,
      wateringFrequency,
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
    if (!hasAgreedToTerms) {
      setAnalysisError("Agree to the Terms of Service before analyzing your quotes.");
      return;
    }
    setIsVerifying(true);
    if (!recaptchaRef.current?.execute()) {
      setAnalysisError("Verification is still loading. Try again in a moment.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <StepIndicator step={step} />

        <div className="mt-7 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:mt-10 sm:p-8 md:p-10">
          {step === 0 && (
            <StepShell
              title="Where's your farm?"
              subtitle="We'll only compare suppliers who deliver to you."
            >
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Farm name, landmark, address, town or postcode
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
                    onClick={() => {
                      setCrops([]);
                      setCropStages({});
                    }}
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
                      onClick={() => {
                        setCrops((current) =>
                          selected ? current.filter((item) => item !== c) : [...current, c],
                        );
                        if (selected) {
                          setCropStages((current) => {
                            const next = { ...current };
                            delete next[c];
                            return next;
                          });
                        }
                      }}
                      className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-all ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                          : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/50"
                      }`}
                    >
                      <span>
                        <span className="block">{c}</span>
                        {!catalogSupportsCrop(c) ? (
                          <span
                            className={`mt-0.5 block text-[10px] font-medium ${selected ? "text-primary-foreground/75" : "text-muted-foreground"}`}
                          >
                            Quote comparison only
                          </span>
                        ) : null}
                      </span>
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
              <section className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-5">
                <h2 className="font-semibold text-foreground">What matters most to you?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This changes how suitable quotes are ranked. It never overrides agronomic safety.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      {
                        value: "yield",
                        label: "Improve yield",
                        description: "Prioritize nutrient and field fit",
                        icon: TrendingUp,
                      },
                      {
                        value: "cost",
                        label: "Reduce costs",
                        description: "Prioritize landed nutrient cost",
                        icon: CircleDollarSign,
                      },
                      {
                        value: "balanced",
                        label: "Balance both",
                        description: "Balance value and crop fit",
                        icon: Scale,
                      },
                    ] as const
                  ).map(({ value, label, description, icon: GoalIcon }) => {
                    const selected = decisionGoal === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setDecisionGoal(value)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                            : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/50"
                        }`}
                      >
                        <GoalIcon className="h-5 w-5" />
                        <span className="mt-3 block text-sm font-semibold">{label}</span>
                        <span
                          className={`mt-1 block text-xs leading-5 ${selected ? "text-primary-foreground/75" : "text-muted-foreground"}`}
                        >
                          {description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="mt-5 rounded-2xl border border-border bg-background p-5">
                <h2 className="font-semibold text-foreground">
                  What kind of fertilizer do you prefer?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We use these preferences after checking crop, soil and application suitability.
                </p>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <fieldset>
                    <legend className="text-sm font-semibold text-foreground">Product form</legend>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {(
                        [
                          ["liquid", "Liquid"],
                          ["dry", "Dry / granular"],
                          ["either", "No preference"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={fertilizerFormPreference === value}
                          onClick={() => setFertilizerFormPreference(value)}
                          className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition ${fertilizerFormPreference === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/30 text-foreground hover:border-primary/50"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend className="text-sm font-semibold text-foreground">Product type</legend>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {(
                        [
                          ["organic", "Organic"],
                          ["synthetic", "Synthetic"],
                          ["either", "No preference"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={fertilizerOriginPreference === value}
                          onClick={() => {
                            setFertilizerOriginPreference(value);
                            if (value !== "organic") setOrganicCertification("");
                          }}
                          className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition ${fertilizerOriginPreference === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/30 text-foreground hover:border-primary/50"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {fertilizerOriginPreference === "organic" && (
                      <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
                        <p className="text-sm font-semibold text-foreground">
                          Are you certified organic? <span className="text-destructive">*</span>
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {(
                            [
                              ["certified", "Yes, certified"],
                              ["not_certified", "No, I prefer organic inputs"],
                            ] as const
                          ).map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={organicCertification === value}
                              onClick={() => setOrganicCertification(value)}
                              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${organicCertification === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/50"}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Certified farms will only receive products with verified OMRI approval.
                        </p>
                      </div>
                    )}
                  </fieldset>
                </div>
              </section>
              <div className="mt-8 space-y-5">
                <section className="rounded-2xl border border-border bg-muted/35 p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Sprout className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="font-semibold text-foreground">Growing conditions</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Stage changes product fit and application-timing checks. Choose “Not sure”
                        if needed.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {crops.map((crop) => (
                      <label key={crop} className="block">
                        <span className="text-sm font-medium text-foreground">{crop} stage</span>
                        <select
                          value={cropStages[crop] || ""}
                          onChange={(event) =>
                            setCropStages((current) => ({ ...current, [crop]: event.target.value }))
                          }
                          className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                        >
                          <option value="">Select a stage</option>
                          {(CROP_STAGES[crop] || CROP_STAGES.Other).map((stageOption) => (
                            <option key={stageOption} value={stageOption}>
                              {stageOption}
                            </option>
                          ))}
                          <option value="Not sure">Not sure</option>
                        </select>
                      </label>
                    ))}
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
                      <div className="rounded-2xl border border-dashed border-primary/35 bg-background p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Upload your lab report to fill this form
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              JPG, PNG, WebP or PDF · 10 MB max. Review every extracted value below.
                            </p>
                          </div>
                          <label
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${isReadingSoilTest ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:-translate-y-0.5"}`}
                          >
                            {isReadingSoilTest ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            {isReadingSoilTest ? "Reading report…" : "Choose soil test"}
                            <input
                              type="file"
                              className="sr-only"
                              disabled={isReadingSoilTest}
                              accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                              onChange={(event) => {
                                handleSoilTestFile(event.target.files?.[0] ?? null);
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                        </div>
                        {soilTestFile && !isReadingSoilTest && !soilTestReadError ? (
                          <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary">
                            <Check className="h-3.5 w-3.5" />
                            {soilTestFile.name} read. Check and edit the values below.
                          </p>
                        ) : null}
                        {soilTestReadError ? (
                          <p className="mt-3 text-sm text-destructive" role="alert">
                            {soilTestReadError}
                          </p>
                        ) : null}
                        {soilTestReadWarnings.length ? (
                          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                            {soilTestReadWarnings.map((warning) => (
                              <li key={warning}>• {warning}</li>
                            ))}
                          </ul>
                        ) : null}
                        <GoogleRecaptcha
                          ref={soilRecaptchaRef}
                          onVerified={(token) => void readSoilTest(token)}
                          onError={(message) => {
                            setSoilTestReadError(message);
                            setIsReadingSoilTest(false);
                            pendingSoilTestFileRef.current = null;
                          }}
                        />
                      </div>
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
                          label="Sulfate-S"
                          value={soilSulfur}
                          onChange={setSoilSulfur}
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
                      <div className="rounded-2xl border border-border bg-background p-4">
                        <h4 className="font-semibold text-foreground">
                          Micronutrients{" "}
                          <span className="font-normal text-muted-foreground">(optional)</span>
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Enter laboratory results only. Leave any unavailable value blank.
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          {MICRONUTRIENT_FIELDS.map((field) => (
                            <ConditionInput
                              key={field.key}
                              label={`${field.label} (${field.unit})`}
                              value={soilMicronutrients[field.key] ?? ""}
                              onChange={(value) =>
                                setSoilMicronutrients((current) => ({
                                  ...current,
                                  [field.key]: value,
                                }))
                              }
                              placeholder={field.placeholder}
                              type="number"
                            />
                          ))}
                        </div>
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
                  <h2 className="font-semibold text-foreground">
                    Prior fertilizer applications this season
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Optional. This helps avoid recommending nutrients that may already have been
                    applied.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["no", "No prior applications"],
                        ["yes", "Yes, fertilizer was applied"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={priorFertilizerApplied === value}
                        onClick={() => {
                          setPriorFertilizerApplied(value);
                          if (value === "no") {
                            setPriorFertilizerApplications([]);
                          }
                          if (value === "yes" && !priorFertilizerApplications.length) {
                            setPriorFertilizerApplications([
                              {
                                id: `application-${Date.now()}`,
                                applicationDate: "",
                                productAnalysis: "",
                                quantity: "",
                                unit: "kg/ha",
                              },
                            ]);
                          }
                        }}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${priorFertilizerApplied === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/50"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {priorFertilizerApplied === "yes" && (
                    <div className="mt-5 space-y-4 border-t border-border pt-5">
                      {priorFertilizerApplications.map((application, index) => (
                        <div
                          key={application.id}
                          className="rounded-2xl border border-border bg-background p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-foreground">
                              Application {index + 1}
                            </h3>
                            {priorFertilizerApplications.length > 1 && (
                              <button
                                type="button"
                                aria-label={`Remove application ${index + 1}`}
                                onClick={() =>
                                  setPriorFertilizerApplications((current) =>
                                    current.filter((item) => item.id !== application.id),
                                  )
                                }
                                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-3 grid gap-4 md:grid-cols-2">
                            <label className="block">
                              <span className="text-sm font-medium text-foreground">
                                Application date
                              </span>
                              <input
                                type="date"
                                value={application.applicationDate}
                                onChange={(event) =>
                                  setPriorFertilizerApplications((current) =>
                                    current.map((item) =>
                                      item.id === application.id
                                        ? { ...item, applicationDate: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                              />
                            </label>
                            <ConditionInput
                              label="Product / analysis applied"
                              value={application.productAnalysis}
                              onChange={(value) =>
                                setPriorFertilizerApplications((current) =>
                                  current.map((item) =>
                                    item.id === application.id
                                      ? { ...item, productAnalysis: value }
                                      : item,
                                  ),
                                )
                              }
                              placeholder="e.g. Urea 46-0-0"
                            />
                            <ConditionInput
                              label="Quantity applied"
                              value={application.quantity}
                              onChange={(value) =>
                                setPriorFertilizerApplications((current) =>
                                  current.map((item) =>
                                    item.id === application.id
                                      ? { ...item, quantity: value }
                                      : item,
                                  ),
                                )
                              }
                              placeholder="e.g. 80"
                              type="number"
                            />
                            <label className="block">
                              <span className="text-sm font-medium text-foreground">Unit</span>
                              <select
                                value={application.unit}
                                onChange={(event) =>
                                  setPriorFertilizerApplications((current) =>
                                    current.map((item) =>
                                      item.id === application.id
                                        ? {
                                            ...item,
                                            unit: event.target
                                              .value as PriorFertilizerApplication["unit"],
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                              >
                                <option value="kg/ha">kg/ha</option>
                                <option value="L/ha">L/ha</option>
                                <option value="lb/ac">lb/ac</option>
                                <option value="gal/ac">gal/ac</option>
                              </select>
                            </label>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setPriorFertilizerApplications((current) => [
                            ...current,
                            {
                              id: `application-${Date.now()}-${current.length}`,
                              applicationDate: "",
                              productAnalysis: "",
                              quantity: "",
                              unit: "kg/ha",
                            },
                          ])
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
                      >
                        <Plus className="h-4 w-4" />
                        Add another application
                      </button>
                    </div>
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
                  <fieldset className="mt-4">
                    <legend className="text-sm font-medium text-foreground">
                      Nutrients to prioritize
                    </legend>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Choose known needs from your soil test or agronomist. This steers the product
                      choice without guessing an application rate.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(
                        [
                          ["N", "Nitrogen"],
                          ["P", "Phosphorus"],
                          ["K", "Potassium"],
                          ["Zn", "Zinc"],
                        ] as const
                      ).map(([value, label]) => {
                        const selected = priorityNutrients.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              setPriorityNutrients((current) =>
                                selected
                                  ? current.filter((nutrient) => nutrient !== value)
                                  : [...current, value],
                              )
                            }
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/50"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <ConditionInput
                      label="Target S (kg/ha)"
                      value={targetSulfurKgHa}
                      onChange={setTargetSulfurKgHa}
                      placeholder="e.g. 20"
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
                  <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                    {photos.length > 0
                      ? `${photos.length} ${photos.length === 1 ? "file" : "files"} ready to analyze${photos.length < MAX_QUOTE_FILES ? ` · add up to ${MAX_QUOTE_FILES - photos.length} more` : ""}`
                      : QUOTE_FILE_HELP_TEXT}
                  </p>
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
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40">
                <input
                  type="checkbox"
                  checked={hasAgreedToTerms}
                  onChange={(event) => {
                    setHasAgreedToTerms(event.target.checked);
                    if (event.target.checked) setAnalysisError("");
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                />
                <span className="text-sm leading-6 text-foreground">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    onClick={(event) => event.stopPropagation()}
                    className="font-semibold text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary"
                  >
                    Terms of Service
                  </Link>
                  .
                </span>
              </label>
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
            <div className="mt-8 flex flex-col-reverse gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}
                disabled={step === 0}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 sm:w-auto"
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
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0 sm:w-auto"
                >
                  {step === 0 && isCheckingLocation ? "Checking…" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canNext || !hasAgreedToTerms || isVerifying}
                  onClick={beginAnalysis}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0 sm:w-auto"
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        inputMode={type === "number" ? "decimal" : undefined}
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
    <ol className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
      {labels.map((label, i) => {
        const done = step > i || step === 3;
        const active = step === i;
        return (
          <li
            key={label}
            className="flex min-w-0 items-center justify-center gap-2 sm:justify-start sm:gap-3"
          >
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
              className={`hidden text-sm min-[360px]:inline ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <span className="mx-1 hidden h-px w-6 bg-border sm:block sm:w-10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

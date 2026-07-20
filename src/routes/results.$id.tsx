import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  Check,
  CloudSun,
  Droplets,
  FileWarning,
  Leaf,
  Sparkles,
  Thermometer,
  Truck,
  Wind,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { assessPartnerProgram, findPartnerProgram } from "@/lib/partner-products";
import { analysisStorageKey, type AnalyzedQuote, type QuoteAnalysis } from "@/lib/quote-analysis";

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Your fertilizer recommendation — FertaFind" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultsPage,
});

function scoreQuote(q: AnalyzedQuote) {
  if (!q.bagKg || !q.pricePerBag) return null;
  const nutrientPercent = q.npk[0] + q.npk[1] + q.npk[2];
  if (nutrientPercent <= 0) return null;
  const nutrientKgPerBag = q.bagKg * (nutrientPercent / 100);
  const deliveryPerBag = (q.bagKg / 1000) * (q.deliveryPerT ?? 0);
  const landedPerBag = q.pricePerBag + deliveryPerBag;
  return {
    nutrientKgPerBag,
    landedPerBag,
    costPerKgNutrient: landedPerBag / nutrientKgPerBag,
    costPerHectare: q.applicationRateKgHa ? (q.applicationRateKgHa / q.bagKg) * landedPerBag : null,
  };
}

function nutrientFitScore(q: AnalyzedQuote, analysis: QuoteAnalysis) {
  const plan = analysis.nutrientPlan;
  if (!plan || !q.applicationRateKgHa) return null;

  const targets = [
    Number(plan.targetNitrogenKgHa),
    Number(plan.targetPhosphorusKgHa),
    Number(plan.targetPotassiumKgHa),
  ];
  const supplied = q.npk.map((percentage) => q.applicationRateKgHa! * (percentage / 100));
  const componentScores = targets.flatMap((target, index) => {
    if (!Number.isFinite(target) || target <= 0) return [];
    const difference = Math.abs(supplied[index] - target) / target;
    return [Math.max(0, 100 - difference * 100)];
  });

  if (!componentScores.length) return null;
  return componentScores.reduce((total, score) => total + score, 0) / componentScores.length;
}

function fieldFitScore(q: AnalyzedQuote) {
  const base = q.agronomicFit === "suitable" ? 100 : q.agronomicFit === "caution" ? 55 : 35;
  if (q.stageFit === "incompatible") return Math.min(base, 15);
  if (q.stageFit === "unknown") return Math.min(base, 55);
  return base;
}

type RankedQuote = {
  q: AnalyzedQuote;
  s: ReturnType<typeof scoreQuote>;
  nutrientFit: number | null;
  fieldFit: number;
  decisionScore: number;
};

function rankQuotes(analysis: QuoteAnalysis): RankedQuote[] {
  const scored = analysis.quotes.map((q) => ({
    q,
    s: scoreQuote(q),
    nutrientFit: nutrientFitScore(q, analysis),
    fieldFit: fieldFitScore(q),
    decisionScore: 0,
  }));
  const costValues = scored
    .map((item) => item.s?.costPerKgNutrient)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const lowestCost = Math.min(...costValues);
  const highestCost = Math.max(...costValues);

  for (const item of scored) {
    const costScore =
      item.s && costValues.length
        ? lowestCost === highestCost
          ? 100
          : 100 - ((item.s.costPerKgNutrient - lowestCost) / (highestCost - lowestCost)) * 100
        : null;
    const hasNutrientPlan = item.nutrientFit !== null;
    const goal = analysis.decisionGoal ?? "balanced";
    const weights = hasNutrientPlan
      ? goal === "yield"
        ? { cost: 0.1, nutrient: 0.6, field: 0.3 }
        : goal === "cost"
          ? { cost: 0.7, nutrient: 0.2, field: 0.1 }
          : { cost: 0.4, nutrient: 0.45, field: 0.15 }
      : goal === "yield"
        ? { cost: 0.2, nutrient: 0, field: 0.8 }
        : goal === "cost"
          ? { cost: 0.85, nutrient: 0, field: 0.15 }
          : { cost: 0.7, nutrient: 0, field: 0.3 };
    const weighted = [
      costScore === null ? null : { value: costScore, weight: weights.cost },
      hasNutrientPlan ? { value: item.nutrientFit!, weight: weights.nutrient } : null,
      { value: item.fieldFit, weight: weights.field },
    ].filter((part): part is { value: number; weight: number } => part !== null);
    item.decisionScore =
      weighted.reduce((total, part) => total + part.value * part.weight, 0) /
      weighted.reduce((total, part) => total + part.weight, 0);
  }

  return scored.sort((a, b) => b.decisionScore - a.decisionScore);
}

function money(value: number | null | undefined, currency: string, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not stated";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${currency || "$"} ${value.toFixed(digits)}`;
  }
}

function decisionGoalLabel(goal: QuoteAnalysis["decisionGoal"] | undefined) {
  if (goal === "yield") return "Improve yield";
  if (goal === "cost") return "Reduce costs";
  return "Balance yield and cost";
}

function preferenceLabel(preferences: QuoteAnalysis["preferences"] | undefined) {
  if (!preferences) return null;
  const form =
    preferences.fertilizerForm === "liquid"
      ? "Liquid"
      : preferences.fertilizerForm === "dry"
        ? "Dry / granular"
        : "Any form";
  const origin =
    preferences.fertilizerOrigin === "organic"
      ? "Organic"
      : preferences.fertilizerOrigin === "synthetic"
        ? "Synthetic"
        : "Any type";
  return `${form} · ${origin}`;
}

function ResultsPage() {
  const { id } = Route.useParams();
  const [analysis, setAnalysis] = useState<QuoteAnalysis | null | undefined>();
  const [sortBy, setSortBy] = useState<"recommended" | "lowest-cost">("recommended");

  useEffect(() => {
    const saved = localStorage.getItem(analysisStorageKey(id));
    if (!saved) {
      setAnalysis(null);
      return;
    }
    try {
      setAnalysis(JSON.parse(saved) as QuoteAnalysis);
    } catch {
      setAnalysis(null);
    }
  }, [id]);

  const ranked = useMemo(() => (analysis ? rankQuotes(analysis) : []), [analysis]);
  const displayedQuotes = useMemo(() => {
    if (sortBy === "recommended") return ranked;
    return [...ranked].sort((a, b) => {
      const first = a.s?.costPerKgNutrient;
      const second = b.s?.costPerKgNutrient;
      if (first === undefined || first === null) return 1;
      if (second === undefined || second === null) return -1;
      return first - second;
    });
  }, [ranked, sortBy]);

  if (analysis === undefined) return <StatusPage title="Loading your recommendation…" />;
  if (!analysis) {
    return (
      <StatusPage
        title="This recommendation isn't available in this browser."
        detail="Run a new analysis to recreate it."
      />
    );
  }

  const best = ranked[0] ?? null;
  const partnerProgram = findPartnerProgram(analysis.crop);
  const partnerAssessment = partnerProgram ? assessPartnerProgram(partnerProgram, analysis) : null;
  const weather = analysis.weather;
  const agronomy = analysis.agronomy;
  const isProvisional = Boolean(
    best && (best.q.agronomicFit !== "suitable" || !best.s || best.q.confidence < 0.75),
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Analyze another quote
        </Link>

        <header className="mt-8 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Analysis complete
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-foreground md:text-6xl">
            Your recommendation
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {analysis.crop} · {analysis.fieldSize} {analysis.unit} · {analysis.location.displayName}
            <span className="mt-1 block text-sm">
              Priority: {decisionGoalLabel(analysis.decisionGoal)}
            </span>
            {preferenceLabel(analysis.preferences) ? (
              <span className="mt-1 block text-sm">
                Preference: {preferenceLabel(analysis.preferences)}
              </span>
            ) : null}
          </p>
        </header>

        {partnerProgram ? (
          <section className="mt-9 overflow-hidden rounded-[2rem] border border-primary/25 bg-card shadow-[var(--shadow-soft)]">
            <div className="h-1.5 bg-primary" />
            <div className="p-7 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  <Award className="h-3.5 w-3.5" />
                  {partnerAssessment?.label}
                </span>
                <div className="h-14 w-28 overflow-hidden rounded-xl border border-border bg-white">
                  <img
                    src="/nanofert-partner.png"
                    alt="Nanofert"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "center 51%" }}
                  />
                </div>
              </div>

              <p className="mt-7 text-sm font-semibold text-primary">{partnerProgram.supplier}</p>
              <h2 className="mt-1 max-w-3xl font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                {partnerProgram.title}
              </h2>
              <p className="mt-3 text-base text-muted-foreground">{partnerAssessment?.summary}</p>

              <div className="mt-7 rounded-2xl bg-primary/7 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  How this match was checked
                </p>
                <p className="mt-2 max-w-3xl text-base leading-7 text-foreground">
                  The product is first matched against the partner catalog by crop. Soil, target
                  nutrients, crop timing, weather and irrigation then determine whether it can be
                  shown as field-checked, needs timing caution, or needs more data.
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground md:grid-cols-2">
                  {partnerAssessment?.checks.slice(0, 4).map((check) => (
                    <li key={check} className="flex gap-2">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <PartnerStat label="Recommended program" value={partnerProgram.title} />
                <PartnerStat label="Supplier-reported rate" value={partnerProgram.rate} />
                <PartnerStat label="Supplier timing" value={partnerProgram.timing} />
              </div>

              <div className="mt-6 flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">{partnerProgram.evidence}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {partnerProgram.sourceNote}
                  </p>
                </div>
                <Link
                  to="/suppliers"
                  className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  View supplier details
                </Link>
              </div>
            </div>
          </section>
        ) : best ? (
          <section className="mt-9 rounded-[2rem] border border-border bg-card p-7 shadow-[var(--shadow-soft)] sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <Award className="h-3.5 w-3.5" />
              {isProvisional ? "Best uploaded option — verify first" : "Best uploaded option"}
            </span>
            <h2 className="mt-6 font-display text-4xl font-semibold text-foreground sm:text-5xl">
              {best.q.product || "Unnamed fertilizer product"}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              No participating supplier program currently matches the selected crop. This is the
              strongest option extracted from the uploaded quote, not a FertaFind partner
              recommendation.
            </p>
          </section>
        ) : (
          <section className="mt-9 rounded-3xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl font-semibold">No fertilizer was extracted</h2>
            <p className="mt-2 text-muted-foreground">Try a clearer quote image or PDF.</p>
          </section>
        )}

        {partnerProgram && best && (
          <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Uploaded quote comparison
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
                  {best.q.product || "Unnamed fertilizer product"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {best.q.supplier || "Supplier not stated on quote"} · This is not the partner
                  recommendation above.
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Extracted from your quote
              </span>
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground">
              {best.q.fitReason ||
                "This quote is retained so you can compare its nutrient analysis and estimated cost with the partner program."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <QuoteStat label="N-P-K" value={best.q.npk.join("-")} />
              <QuoteStat
                label={
                  best.s?.costPerHectare == null ? "Quoted price / unit" : "Estimated cost / ha"
                }
                value={
                  best.s?.costPerHectare == null
                    ? money(best.q.pricePerBag, best.q.currency)
                    : money(best.s.costPerHectare, best.q.currency)
                }
              />
              <QuoteStat
                label="Landed / unit"
                value={money(best.s?.landedPerBag, best.q.currency)}
              />
              <QuoteStat label="Quote score" value={`${Math.round(best.decisionScore)}/100`} />
            </div>
          </section>
        )}

        {best && !partnerProgram && (
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <SimpleReason
              icon={<Leaf className="h-5 w-5" />}
              label="Product fit"
              value={
                best.q.applicationRateKgHa
                  ? `NPK ${best.q.npk.join("-")} at ${best.q.applicationRateKgHa} kg/ha from the quote.`
                  : `NPK ${best.q.npk.join("-")}; application rate was not stated.`
              }
            />
            <SimpleReason
              icon={<Award className="h-5 w-5" />}
              label="Cost basis"
              value={
                best.s
                  ? `${money(best.s.costPerKgNutrient, best.q.currency, 2)} per kg of total stated N+P+K.`
                  : "A complete price, pack size and NPK basis was not available."
              }
            />
            <SimpleReason
              icon={<CloudSun className="h-5 w-5" />}
              label="Field conditions"
              value={
                agronomy?.timingGuidance ||
                "The recommendation uses the crop and field information available in this analysis."
              }
            />
          </section>
        )}

        {analysis.warnings.length > 0 && (
          <section className="mt-8 rounded-2xl border border-secondary/50 bg-secondary/10 p-5">
            <div className="flex gap-3">
              <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
              <div>
                <h2 className="font-semibold text-foreground">Check before buying</h2>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                  {analysis.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {agronomy?.factorChecks && (
          <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Recommendation audit
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
              What changed the result
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Each input below must be used, flagged as incomplete, or shown as missing. Nothing here proves a universal prescription.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(
                [
                  ["Location", agronomy.factorChecks.location],
                  ["Field size", agronomy.factorChecks.fieldSize],
                  ["Decision priority", agronomy.factorChecks.decisionGoal],
                  ["Crop lifecycle", agronomy.factorChecks.cropStage],
                  ["Laboratory soil", agronomy.factorChecks.soil],
                  ["Weather", agronomy.factorChecks.weather],
                  ["Watering", agronomy.factorChecks.irrigation],
                  ["Nutrient targets", agronomy.factorChecks.nutrientTargets],
                  ["Product preferences", agronomy.factorChecks.productPreferences],
                ] as const
              ).map(([label, check]) => (
                <FactorCheck key={label} label={label} status={check.status} effect={check.effect} />
              ))}
            </div>
          </section>
        )}

        <details className="group mt-8 rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <summary className="cursor-pointer list-none px-6 py-5 font-display text-lg font-semibold text-foreground sm:px-8">
            Farm data used in this recommendation
            <span className="float-right text-sm font-normal text-muted-foreground group-open:hidden">
              View details
            </span>
            <span className="float-right hidden text-sm font-normal text-muted-foreground group-open:inline">
              Hide details
            </span>
          </summary>
          <div className="border-t border-border px-6 py-6 sm:px-8">
            {weather && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <WeatherStat
                  icon={<Thermometer className="h-4 w-4" />}
                  label="Air"
                  value={weather.temperatureC == null ? "—" : `${weather.temperatureC}°C`}
                />
                <WeatherStat
                  icon={<Droplets className="h-4 w-4" />}
                  label="Humidity"
                  value={weather.humidityPercent == null ? "—" : `${weather.humidityPercent}%`}
                />
                <WeatherStat
                  icon={<CloudSun className="h-4 w-4" />}
                  label="3-day rain"
                  value={weather.next3DaysRainMm == null ? "—" : `${weather.next3DaysRainMm} mm`}
                />
                <WeatherStat
                  icon={<Wind className="h-4 w-4" />}
                  label="Wind"
                  value={weather.windSpeedKph == null ? "—" : `${weather.windSpeedKph} km/h`}
                />
                <WeatherStat
                  icon={<Thermometer className="h-4 w-4" />}
                  label="Surface soil"
                  value={weather.soilTemperatureC == null ? "—" : `${weather.soilTemperatureC}°C`}
                />
                <WeatherStat
                  icon={<Droplets className="h-4 w-4" />}
                  label="3-day ET₀"
                  value={
                    weather.next3DaysEt0Mm == null ? "—" : `${weather.next3DaysEt0Mm.toFixed(1)} mm`
                  }
                />
              </div>
            )}
            {agronomy && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <GuidanceCard
                  label="Weather and timing"
                  text={`${agronomy.weatherSummary} ${agronomy.timingGuidance}`}
                />
                <GuidanceCard
                  label="Soil information"
                  text={`${agronomy.soilTestSummary || "No laboratory soil test was supplied."} ${agronomy.soilGuidance}`}
                />
                <GuidanceCard
                  label="Watering"
                  text={agronomy.irrigationGuidance || "No irrigation guidance was returned."}
                />
                <GuidanceCard label="Caution" text={agronomy.caution} />
              </div>
            )}
            <div className="mt-5 rounded-2xl border border-border bg-muted/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Data sources and confidence
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
                <li>
                  Quote product, nutrient and price values were extracted by AI from the uploaded
                  files and must be checked against the original quote.
                </li>
                <li>
                  Soil and irrigation values are farmer-entered or laboratory-supplied; FertaFind
                  does not independently verify them.
                </li>
                <li>
                  Weather and surface-soil estimates come from Open-Meteo for the selected
                  coordinates and may differ from field measurements.
                </li>
                <li>
                  Partner rates and trial results are supplier-reported. A crop match is not proof
                  that a product is the best option for a specific field.
                </li>
              </ul>
            </div>
          </div>
        </details>

        <section id="alternatives" className="mt-12 scroll-mt-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Quote comparison
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">
                {analysis.quotes.length === 1
                  ? "The uploaded fertilizer"
                  : "Other extracted options"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {analysis.quotes.length === 1
                  ? "Only one product was extracted, so this is a fit assessment rather than a comparison against another quote."
                  : partnerProgram
                    ? "These are products extracted from your uploads. The FertaFind partner recommendation remains above."
                    : "The best uploaded option remains highlighted. You can also sort by landed nutrient cost."}
              </p>
            </div>
            {analysis.quotes.length > 1 && (
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sort
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as "recommended" | "lowest-cost")
                  }
                  className="min-w-52 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="recommended">Recommended first</option>
                  <option value="lowest-cost">Lowest nutrient cost</option>
                </select>
              </label>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            {displayedQuotes.map(({ q, s, decisionScore }, index) => (
              <article
                key={q.id}
                className={`rounded-2xl border p-5 sm:p-6 ${q.id === best?.q.id ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground font-display text-sm font-semibold text-background">
                    {index + 1}
                  </span>
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {q.product || "Unnamed fertilizer product"}
                      </h3>
                      {q.id === best?.q.id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                          <Check className="h-3 w-3" />
                          {partnerProgram ? "Best uploaded quote" : "Best uploaded option"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {q.supplier || "Supplier not stated"} · NPK {q.npk.join("-")} ·{" "}
                      {q.bagKg ? `${q.bagKg} kg unit` : "unit size not stated"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {q.fitReason || q.notes || `Extracted from ${q.sourceFile}`}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      <span className="font-semibold text-foreground">Lifecycle check:</span>{" "}
                      {q.stageReason || "The quote did not provide enough timing detail to verify this stage."}
                    </p>
                  </div>
                  <div className="grid min-w-[250px] grid-cols-3 gap-4 text-right">
                    <MiniStat
                      label="Nutrient cost"
                      value={s ? money(s.costPerKgNutrient, q.currency, 2) : "—"}
                    />
                    <MiniStat
                      label={s?.costPerHectare == null ? "Quoted / unit" : "Cost / ha"}
                      value={
                        s?.costPerHectare == null
                          ? money(q.pricePerBag, q.currency)
                          : money(s.costPerHectare, q.currency)
                      }
                    />
                    <MiniStat label="Score" value={`${Math.round(decisionScore)}/100`} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-9 text-center text-xs leading-5 text-muted-foreground">
          AI extraction and recommendations can be wrong. Confirm the product, rate, nutrient
          analysis, price and freight with the supplier and a qualified local agronomist before
          applying or purchasing.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatusPage({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
        {detail && <p className="mt-3 text-muted-foreground">{detail}</p>}
        <Link
          to="/analyze"
          className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Start an analysis
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function PartnerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{value}</p>
    </div>
  );
}

function QuoteStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-display text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SimpleReason({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <p className="mt-4 font-semibold text-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function WeatherStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function GuidanceCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-base font-semibold text-foreground sm:text-lg">{value}</div>
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function FactorCheck({
  label,
  status,
  effect,
}: {
  label: string;
  status: "used" | "missing" | "caution";
  effect: string;
}) {
  const statusLabel = status === "used" ? "Used" : status === "missing" ? "Missing" : "Check";
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${status === "used" ? "bg-primary/10 text-primary" : "bg-secondary/20 text-foreground"}`}>
          {statusLabel}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{effect}</p>
    </div>
  );
}

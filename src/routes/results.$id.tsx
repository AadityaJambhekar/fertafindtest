import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  Check,
  CloudSun,
  Droplets,
  FileWarning,
  MapPin,
  Sparkles,
  Store,
  Thermometer,
  Truck,
  Wind,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
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
  if (q.agronomicFit === "suitable") return 100;
  if (q.agronomicFit === "caution") return 55;
  return 35;
}

type RankedQuote = {
  q: AnalyzedQuote;
  s: ReturnType<typeof scoreQuote>;
  nutrientFit: number | null;
  fieldFit: number;
  decisionScore: number;
};

type NearbySupplier = {
  id: string;
  business_name: string;
  address: string;
  distanceKm: number;
  description: string | null;
  website: string | null;
  phone: string | null;
  source?: "FertaFind" | "OpenStreetMap";
  products: Array<{
    id: string;
    product_name: string;
    nitrogen_percent: number;
    phosphorus_percent: number;
    potassium_percent: number;
    package_kg: number | null;
    price_per_unit: number | null;
    delivery_per_tonne: number | null;
    currency: string;
  }>;
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
    const weighted = [
      costScore === null ? null : { value: costScore, weight: hasNutrientPlan ? 0.4 : 0.7 },
      hasNutrientPlan ? { value: item.nutrientFit!, weight: 0.45 } : null,
      { value: item.fieldFit, weight: hasNutrientPlan ? 0.15 : 0.3 },
    ].filter((part): part is { value: number; weight: number } => part !== null);
    item.decisionScore =
      weighted.reduce((total, part) => total + part.value * part.weight, 0) /
      weighted.reduce((total, part) => total + part.weight, 0);
  }

  return scored.sort((a, b) => b.decisionScore - a.decisionScore);
}

function money(value: number | null, currency: string, digits = 0) {
  if (value === null || !Number.isFinite(value)) return "Not stated";
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

function ResultsPage() {
  const { id } = Route.useParams();
  const [analysis, setAnalysis] = useState<QuoteAnalysis | null | undefined>();
  const [sortBy, setSortBy] = useState<"recommended" | "lowest-cost">("recommended");
  const [nearbySuppliers, setNearbySuppliers] = useState<NearbySupplier[] | null>(null);
  const [hasOpenStreetMapResults, setHasOpenStreetMapResults] = useState(false);

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

  useEffect(() => {
    if (!analysis) return;
    const params = new URLSearchParams({
      lat: String(analysis.location.lat),
      lon: String(analysis.location.lon),
      radiusKm: String(analysis.location.radiusKm),
    });
    void fetch(`/api/nearby-suppliers?${params}`)
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as {
              suppliers?: NearbySupplier[];
              openStreetMapAttribution?: boolean;
            })
          : null,
      )
      .then((data) => {
        setNearbySuppliers(data?.suppliers ?? []);
        setHasOpenStreetMapResults(Boolean(data?.openStreetMapAttribution));
      })
      .catch(() => {
        setNearbySuppliers([]);
        setHasOpenStreetMapResults(false);
      });
  }, [analysis]);

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

  if (analysis === undefined) {
    return <StatusPage title="Loading your analysis…" />;
  }
  if (!analysis) {
    return (
      <StatusPage
        title="This analysis isn't available in this browser."
        detail="Results are kept privately in this browser. Run a new analysis to recreate them."
      />
    );
  }

  const best = ranked[0] ?? null;
  const weather = analysis.weather;
  const agronomy = analysis.agronomy;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-14">
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Analyze another set
        </Link>

        <div className="mt-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Analysis complete · {analysis.quotes.length} quote
            {analysis.quotes.length === 1 ? "" : "s"} found
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-foreground md:text-5xl">
            {best ? "Your best-value fertilizer" : "Your extracted quote details"}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {best
              ? "Ranked using landed nutrient cost, nutrient-plan coverage, and the crop, soil and weather fit."
              : "We found quote information, but at least one price, pack size or N-P-K value is missing, so a fair ranking is not possible yet."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {analysis.crop} · {analysis.fieldSize} {analysis.unit} · {analysis.location.displayName}
          </p>
        </div>

        {analysis.warnings.length > 0 && (
          <div className="mt-8 rounded-2xl border border-secondary/50 bg-secondary/10 p-5">
            <div className="flex gap-3">
              <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
              <div>
                <h2 className="font-semibold text-foreground">Check these details</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {analysis.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {(weather || agronomy) && (
          <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CloudSun className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Farm conditions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Weather from your map pin, used alongside the crop and soil information you
                  entered.
                </p>
              </div>
            </div>
            {weather && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <WeatherStat
                  icon={<Thermometer className="h-4 w-4" />}
                  label="Temperature"
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
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <GuidanceCard
                  label="Weather & timing"
                  text={`${agronomy.weatherSummary} ${agronomy.timingGuidance}`}
                />
                <GuidanceCard
                  label="Soil test used"
                  text={`${agronomy.soilTestSummary ?? "No laboratory soil-test summary was returned."} ${agronomy.soilGuidance}`}
                />
                <GuidanceCard
                  label="Watering & incorporation"
                  text={agronomy.irrigationGuidance ?? "No irrigation guidance was returned."}
                />
                <GuidanceCard label="Important caution" text={agronomy.caution} />
              </div>
            )}
            <p className="mt-5 text-xs text-muted-foreground">
              Conditions guidance supports planning only. Confirm rates and timing with local soil
              tests and a qualified agronomist.
            </p>
          </section>
        )}

        {best && best.s && (
          <div
            className="mt-10 overflow-hidden rounded-[2rem] p-8 shadow-[var(--shadow-lift)] md:p-10"
            style={{ background: "var(--gradient-hero)" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              <Award className="h-3.5 w-3.5" />
              Best comparable value
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold text-primary-foreground md:text-4xl">
              {best.q.product || "Unnamed fertilizer product"}
            </h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-primary-foreground/80">
              <span>{best.q.supplier || "Supplier not stated"}</span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4" />
                {best.q.deliveryPerT === null
                  ? "Delivery not stated"
                  : `${money(best.q.deliveryPerT, best.q.currency)}/t delivery`}
              </span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
              <BigStat
                label="Cost / kg nutrient"
                value={money(best.s.costPerKgNutrient, best.q.currency, 2)}
              />
              <BigStat label="Decision score" value={`${Math.round(best.decisionScore)}/100`} />
              <BigStat
                label="Cost / hectare"
                value={money(best.s.costPerHectare, best.q.currency)}
              />
              <BigStat label="Landed / unit" value={money(best.s.landedPerBag, best.q.currency)} />
              <BigStat label="NPK" value={best.q.npk.join("-")} />
            </div>
          </div>
        )}

        {nearbySuppliers !== null && (
          <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Suppliers in your delivery area
                </h2>
                <p className="text-sm text-muted-foreground">
                  Approved suppliers and public agricultural business listings near your farm pin.
                </p>
              </div>
            </div>
            {nearbySuppliers.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                No approved suppliers are listed for this area yet. Supplier listings will appear
                here once they are approved.
              </p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {nearbySuppliers.map((supplier) => (
                  <article
                    key={supplier.id}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{supplier.business_name}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {supplier.distanceKm} km away{" "}
                          {supplier.source === "OpenStreetMap"
                            ? "· public listing"
                            : "· verified listing"}
                        </p>
                      </div>
                      {supplier.website && (
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Website
                        </a>
                      )}
                    </div>
                    {supplier.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {supplier.description}
                      </p>
                    )}
                    {supplier.products.length > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Products: </span>
                        {supplier.products
                          .slice(0, 3)
                          .map(
                            (product) =>
                              `${product.product_name} (${product.nitrogen_percent}-${product.phosphorus_percent}-${product.potassium_percent})`,
                          )
                          .join(", ")}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
            {hasOpenStreetMapResults && (
              <p className="mt-4 text-xs text-muted-foreground">
                Some supplier locations are from © OpenStreetMap contributors. Public listings may
                not include current prices, delivery coverage, or stock.
              </p>
            )}
          </section>
        )}

        <div className="mt-14 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-semibold text-foreground">
              Extracted options
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare the recommendation or arrange comparable products by landed nutrient cost.
            </p>
          </div>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sort options
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as "recommended" | "lowest-cost")}
              className="min-w-56 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="recommended">Recommended for your field</option>
              <option value="lowest-cost">Lowest to highest cost</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-4">
          {displayedQuotes.map(({ q, s, decisionScore }, index) => (
            <div
              key={q.id}
              className={`rounded-3xl border p-6 ${q.id === best?.q.id && s ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="flex flex-wrap items-start gap-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary font-display text-lg text-primary-foreground">
                  {index + 1}
                </div>
                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-display text-lg font-semibold text-foreground">
                      {q.product || "Unnamed fertilizer product"}
                    </h4>
                    {q.id === best?.q.id && s && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                        <Check className="h-3 w-3" /> Pick
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {q.supplier || "Supplier not stated"} · NPK {q.npk.join("-")} ·{" "}
                    {q.bagKg ? `${q.bagKg} kg unit` : "pack size not stated"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Source: {q.sourceFile} · extraction confidence {Math.round(q.confidence * 100)}%
                  </p>
                  {q.notes && <p className="mt-2 text-xs text-muted-foreground">{q.notes}</p>}
                  {q.fitReason && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Field fit: </span>
                      {q.fitReason}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-5 text-right sm:grid-cols-3">
                  <MiniStat
                    label="/ kg N+P+K"
                    value={s ? money(s.costPerKgNutrient, q.currency, 2) : "—"}
                    highlight={q.id === best?.q.id && !!s}
                  />
                  <MiniStat
                    label="/ hectare"
                    value={s ? money(s.costPerHectare, q.currency) : "—"}
                  />
                  <MiniStat label="Fit score" value={`${Math.round(decisionScore)}/100`} />
                  <MiniStat label="Quoted unit" value={money(q.pricePerBag, q.currency)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          AI extraction can make mistakes. Confirm product rates, nutrient analysis, freight and
          price with the supplier before purchasing.
        </p>
      </section>
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

function WeatherStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-lg font-semibold text-foreground">{value}</p>
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

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-wider text-primary-foreground/60">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold text-primary-foreground">
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-display text-lg font-semibold ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

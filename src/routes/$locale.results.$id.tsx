import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocale, useLocalePath, useDictionary } from "@/components/locale-context";
import { localeToSegment, segmentToLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { getDictionary, type Dictionary } from "@/lib/dictionaries";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  Check,
  CloudSun,
  Droplets,
  FileWarning,
  Sparkles,
  Thermometer,
  Wind,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  recommendPartnerProducts,
  type CropPartnerRecommendation,
  type EvaluatedPartnerProduct,
} from "@/lib/partner-recommendations";
import { analysisStorageKey, type QuoteAnalysis } from "@/lib/quote-analysis";
import { rankQuotes, showsComparisonRanking } from "@/lib/quote-comparison";

export const Route = createFileRoute("/$locale/results/$id")({
  head: ({ params }) => ({
    meta: [
      { title: getDictionary(segmentToLocale(params.locale) ?? DEFAULT_LOCALE).results.metaTitle },
      // Customer-specific page: keep it out of every index. A matching X-Robots-Tag
      // header is also delivered server-side (see src/server.ts).
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResultsPage,
});

type ResultsDict = Dictionary["results"];

function money(
  value: number | null | undefined,
  currency: string,
  digits = 0,
  notStated = "Not stated",
) {
  if (value === null || value === undefined || !Number.isFinite(value)) return notStated;
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

function decisionGoalLabel(goal: QuoteAnalysis["decisionGoal"] | undefined, r: ResultsDict) {
  if (goal === "yield") return r.goalYield;
  if (goal === "cost") return r.goalCost;
  return r.goalBalanced;
}

function preferenceLabel(preferences: QuoteAnalysis["preferences"] | undefined, r: ResultsDict) {
  if (!preferences) return null;
  const form =
    preferences.fertilizerForm === "liquid"
      ? r.formLiquid
      : preferences.fertilizerForm === "dry"
        ? r.formDry
        : r.formAny;
  const origin =
    preferences.fertilizerOrigin === "organic"
      ? r.typeOrganic
      : preferences.fertilizerOrigin === "synthetic"
        ? r.typeSynthetic
        : r.typeAny;
  return `${form} · ${origin}`;
}

function ResultsPage() {
  const { locale } = useLocale();
  const t = useDictionary();
  const r = t.results;
  const lp = useLocalePath();
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

  if (analysis === undefined) return <StatusPage title={r.loadingTitle} />;
  if (!analysis) {
    return <StatusPage title={r.notAvailableTitle} detail={r.notAvailableDetail} />;
  }

  const best = ranked[0] ?? null;
  const partnerRecommendations = recommendPartnerProducts(analysis);
  const hasPartnerRecommendation = partnerRecommendations.some(
    (recommendation) => recommendation.selectedProducts.length > 0,
  );
  const weather = analysis.weather;
  const agronomy = analysis.agronomy;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 md:py-16">
        <Link
          to="/$locale/analyze"
          params={{ locale: localeToSegment(locale) }}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {r.analyzeAnother}
        </Link>

        <header className="mt-8 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {r.analysisComplete}
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-foreground md:text-6xl">
            {r.yourRecommendation}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {analysis.crop} · {analysis.fieldSize} {analysis.unit} · {analysis.location.displayName}
            <span className="mt-1 block text-sm">
              {r.priority}: {decisionGoalLabel(analysis.decisionGoal, r)}
            </span>
            {preferenceLabel(analysis.preferences, r) ? (
              <span className="mt-1 block text-sm">
                {r.preference}: {preferenceLabel(analysis.preferences, r)}
              </span>
            ) : null}
          </p>
        </header>

        <section className="mt-9 overflow-hidden rounded-[2rem] border border-primary/25 bg-card shadow-[var(--shadow-soft)]">
          <div className="h-1.5 bg-primary" />
          <div className="p-5 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                <Award className="h-3.5 w-3.5" />
                {partnerRecommendations.length === 1
                  ? r.partnerRecommendation
                  : r.cropRecommendations.replace("{n}", String(partnerRecommendations.length))}
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

            <div className="mt-7 grid gap-5">
              {partnerRecommendations.map((recommendation) => (
                <PartnerRecommendationCard
                  key={`${recommendation.crop}-${recommendation.lifecycleStage}`}
                  recommendation={recommendation}
                />
              ))}
            </div>
            <a
              href={`${lp("/")}#partners`}
              className="mt-6 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {r.viewPartnerDetails}
            </a>
          </div>
        </section>

        {analysis.warnings.length > 0 && (
          <section className="mt-8 rounded-2xl border border-secondary/50 bg-secondary/10 p-5">
            <div className="flex gap-3">
              <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
              <div>
                <h2 className="font-semibold text-foreground">{r.checkBeforeBuying}</h2>
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
              {r.recommendationAudit}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
              {r.whatChanged}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{r.auditIntro}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(
                [
                  [r.factorLocation, agronomy.factorChecks.location],
                  [r.factorFieldSize, agronomy.factorChecks.fieldSize],
                  [r.factorDecision, agronomy.factorChecks.decisionGoal],
                  [r.factorCrop, agronomy.factorChecks.cropStage],
                  [r.factorSoil, agronomy.factorChecks.soil],
                  [r.factorWeather, agronomy.factorChecks.weather],
                  [r.factorWatering, agronomy.factorChecks.irrigation],
                  [r.factorTargets, agronomy.factorChecks.nutrientTargets],
                  [r.factorPrefs, agronomy.factorChecks.productPreferences],
                ] as const
              ).map(([label, check]) => (
                <FactorCheck
                  key={label}
                  label={label}
                  status={check.status}
                  effect={check.effect}
                />
              ))}
            </div>
          </section>
        )}

        <details className="group mt-8 rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <summary className="cursor-pointer list-none px-6 py-5 font-display text-lg font-semibold text-foreground sm:px-8">
            {r.farmDataTitle}
            <span className="float-right text-sm font-normal text-muted-foreground group-open:hidden">
              {r.viewDetails}
            </span>
            <span className="float-right hidden text-sm font-normal text-muted-foreground group-open:inline">
              {r.hideDetails}
            </span>
          </summary>
          <div className="border-t border-border px-6 py-6 sm:px-8">
            {weather && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <WeatherStat
                  icon={<Thermometer className="h-4 w-4" />}
                  label={r.weatherAir}
                  value={weather.temperatureC == null ? "—" : `${weather.temperatureC}°C`}
                />
                <WeatherStat
                  icon={<Droplets className="h-4 w-4" />}
                  label={r.weatherHumidity}
                  value={weather.humidityPercent == null ? "—" : `${weather.humidityPercent}%`}
                />
                <WeatherStat
                  icon={<CloudSun className="h-4 w-4" />}
                  label={r.weather3dayRain}
                  value={weather.next3DaysRainMm == null ? "—" : `${weather.next3DaysRainMm} mm`}
                />
                <WeatherStat
                  icon={<Wind className="h-4 w-4" />}
                  label={r.weatherWind}
                  value={weather.windSpeedKph == null ? "—" : `${weather.windSpeedKph} km/h`}
                />
                <WeatherStat
                  icon={<Thermometer className="h-4 w-4" />}
                  label={r.weatherSurfaceSoil}
                  value={weather.soilTemperatureC == null ? "—" : `${weather.soilTemperatureC}°C`}
                />
                <WeatherStat
                  icon={<Droplets className="h-4 w-4" />}
                  label={r.weather3dayEt0}
                  value={
                    weather.next3DaysEt0Mm == null ? "—" : `${weather.next3DaysEt0Mm.toFixed(1)} mm`
                  }
                />
              </div>
            )}
            {agronomy && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <GuidanceCard
                  label={r.guidanceWeather}
                  text={`${agronomy.weatherSummary} ${agronomy.timingGuidance}`}
                />
                <GuidanceCard
                  label={r.guidanceSoil}
                  text={`${agronomy.soilTestSummary || r.noSoilTest} ${agronomy.soilGuidance}`}
                />
                <GuidanceCard
                  label={r.guidanceWatering}
                  text={agronomy.irrigationGuidance || r.noIrrigation}
                />
                <GuidanceCard label={r.guidanceCaution} text={agronomy.caution} />
              </div>
            )}
            <div className="mt-5 rounded-2xl border border-border bg-muted/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {r.dataSourcesTitle}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
                <li>{r.dataSource1}</li>
                <li>{r.dataSource2}</li>
                <li>{r.dataSource3}</li>
                <li>{r.dataSource4}</li>
              </ul>
            </div>
          </div>
        </details>

        <section id="alternatives" className="mt-12 scroll-mt-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {r.quoteComparison}
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">
                {analysis.quotes.length === 1 ? r.theUploadedFertilizer : r.otherExtractedOptions}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {analysis.quotes.length === 1
                  ? r.comparisonSingle
                  : hasPartnerRecommendation
                    ? r.comparisonWithPartner
                    : r.comparisonNoPartner}
              </p>
            </div>
            {analysis.quotes.length > 1 && (
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {r.sort}
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as "recommended" | "lowest-cost")
                  }
                  className="min-w-52 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="recommended">{r.sortScore}</option>
                  <option value="lowest-cost">{r.sortLowestCost}</option>
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
                  <div className="min-w-0 flex-1 basis-full sm:min-w-[220px] sm:basis-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {q.product || r.unnamedProduct}
                      </h3>
                      {showsComparisonRanking(analysis.quotes.length) && q.id === best?.q.id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                          <Check className="h-3 w-3" />
                          {r.topComparison}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {q.supplier || r.supplierNotStated} · NPK {q.npk.join("-")} ·{" "}
                      {q.bagKg ? r.unitKg.replace("{kg}", String(q.bagKg)) : r.unitSizeNotStated}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {q.fitReason || q.notes || r.extractedFrom.replace("{file}", q.sourceFile)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      <span className="font-semibold text-foreground">{r.lifecycleCheck}:</span>{" "}
                      {q.stageReason || r.noTimingDetail}
                    </p>
                  </div>
                  <div className="grid w-full grid-cols-3 gap-2 text-left sm:w-auto sm:min-w-[250px] sm:gap-4 sm:text-right">
                    <MiniStat
                      label={r.nutrientCost}
                      value={s ? money(s.costPerKgNutrient, q.currency, 2, r.notStated) : "—"}
                    />
                    <MiniStat
                      label={s?.costPerHectare == null ? r.quotedPerUnit : r.costPerHa}
                      value={
                        s?.costPerHectare == null
                          ? money(q.pricePerBag, q.currency, 0, r.notStated)
                          : money(s.costPerHectare, q.currency, 0, r.notStated)
                      }
                    />
                    <MiniStat label={r.score} value={`${Math.round(decisionScore)}/100`} />
                  </div>
                </div>
              </article>
            ))}
            {displayedQuotes.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm leading-6 text-muted-foreground">
                {r.noExtracted}
              </div>
            )}
          </div>
        </section>

        <p className="mt-9 text-center text-xs leading-5 text-muted-foreground">
          {r.bottomDisclaimer}
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatusPage({ title, detail }: { title: string; detail?: string }) {
  const { locale } = useLocale();
  const t = useDictionary();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
        {detail && <p className="mt-3 text-muted-foreground">{detail}</p>}
        <Link
          to="/$locale/analyze"
          params={{ locale: localeToSegment(locale) }}
          className="mt-8 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          {t.results.startAnalysis}
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function PartnerRecommendationCard({
  recommendation,
}: {
  recommendation: CropPartnerRecommendation;
}) {
  const r = useDictionary().results;
  const unsupported = recommendation.status === "unsupported";
  const noVerifiedStageMatch = !unsupported && recommendation.selectedProducts.length === 0;
  return (
    <article className="rounded-3xl border border-border bg-background p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {recommendation.crop} · {recommendation.lifecycleStage}
          </p>
          <h2 className="mt-2 max-w-3xl font-display text-3xl font-semibold leading-tight text-foreground">
            {unsupported
              ? r.noParticipatingMatch
              : recommendation.selectedProducts.length
                ? recommendation.selectedProducts.map((product) => product.product.name).join(" + ")
                : r.noStageCompatible}
          </h2>
          {!unsupported && (
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {r.supplierLabel}: {recommendation.supplier}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${unsupported ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
        >
          {unsupported ? r.quoteComparisonOnly : recommendation.label}
        </span>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
        {recommendation.summary}
      </p>

      {noVerifiedStageMatch && (
        <div className="mt-5 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">{r.noVerifiedStageTitle}</p>
          <p className="mt-1">{r.noVerifiedStageBody}</p>
        </div>
      )}

      {recommendation.selectedProducts.length > 0 && (
        <div className="mt-6 grid gap-4">
          {recommendation.selectedProducts.map((product) => (
            <PartnerProductCard key={product.product.id} product={product} />
          ))}
        </div>
      )}

      {recommendation.factorsUsed.length > 0 && (
        <details className="mt-5 rounded-2xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            {r.factorsUsedSummary}
          </summary>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground md:grid-cols-2">
            {recommendation.factorsUsed.map((factor) => (
              <li key={factor.label} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">{factor.label}:</strong> {factor.detail}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {recommendation.missingInformation.length > 0 && (
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-foreground">{r.missingInformation}: </span>
          {recommendation.missingInformation.join("; ")}.
        </p>
      )}

      {recommendation.alternatives.length > 0 && (
        <details className="mt-4 border-t border-border pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            {noVerifiedStageMatch
              ? r.productsRequiringStage.replace("{n}", String(recommendation.alternatives.length))
              : r.otherAlternatives.replace("{n}", String(recommendation.alternatives.length))}
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {recommendation.alternatives.map((alternative) => (
              <div
                key={`${alternative.product.id}-${alternative.use.protocolId}`}
                className="rounded-xl bg-muted/50 p-3"
              >
                <p className="text-sm font-semibold text-foreground">{alternative.product.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {alternative.use.timing} · {alternative.use.rate || r.confirmRate}
                  {" · "}
                  {alternative.score}/100
                </p>
                {noVerifiedStageMatch && (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    {r.notARecommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {recommendation.excluded.length > 0 && (
        <details className="mt-4 border-t border-border pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            {r.excludedByLifecycle.replace("{n}", String(recommendation.excluded.length))}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
            {recommendation.excluded.map((item) => (
              <li key={`${item.productName}-${item.reason}`}>
                <strong className="text-foreground">{item.productName}:</strong> {item.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function PartnerProductCard({ product }: { product: EvaluatedPartnerProduct }) {
  const r = useDictionary().results;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            {product.product.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.product.supplier} · {product.product.form} ·{" "}
            {r.suitabilityScore.replace("{score}", String(product.score))}
          </p>
        </div>
        <span className="rounded-full bg-secondary/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
          {product.suitability === "compatible" ? r.compatible : r.needsVerification}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/55 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {r.guaranteedAnalysis}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {product.product.guaranteedAnalysis || r.confirmComposition}
          </p>
        </div>
        <div className="rounded-xl bg-muted/55 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {r.productFocus}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {product.product.lifecycleFocus || r.confirmFocus}
          </p>
        </div>
        <div className="rounded-xl bg-muted/55 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {r.verifiedRate}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {product.use.rate || r.confirmRate}
          </p>
        </div>
        <div className="rounded-xl bg-muted/55 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {r.verifiedTiming}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{product.use.timing}</p>
        </div>
        <div className="rounded-xl bg-muted/55 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {r.farmerPrice}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {product.product.price && product.product.currency
              ? `${money(product.product.price, product.product.currency, 2, r.notStated)} / L`
              : r.confirmPrice}
          </p>
        </div>
        <div className="rounded-xl bg-muted/55 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {r.estimatedProductCost}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {product.estimatedPrice
              ? `${money(product.estimatedPrice.amount, product.estimatedPrice.currency, 2, r.notStated)} / ha`
              : r.needsRate}
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
        {product.whySelected.map((reason) => (
          <li key={reason} className="flex gap-2">
            <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      <details className="mt-4 border-t border-border pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-foreground">
          {r.scoreCalc.replace("{score}", String(product.score))}
        </summary>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
          {product.scoreComponents.map((component) => (
            <li key={component.label}>
              <strong className="text-foreground">
                {component.points > 0 ? "+" : ""}
                {component.points} — {component.label}:
              </strong>{" "}
              {component.detail}
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        <span className="font-semibold text-foreground">{r.evidence}: </span>
        {product.use.source}
      </p>
      {product.product.priceSource ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-foreground">{r.priceSource}: </span>
          {product.product.priceSource}
        </p>
      ) : null}
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
  const r = useDictionary().results;
  const statusLabel =
    status === "used" ? r.statusUsed : status === "missing" ? r.statusMissing : r.statusCheck;
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${status === "used" ? "bg-primary/10 text-primary" : "bg-secondary/20 text-foreground"}`}
        >
          {statusLabel}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{effect}</p>
    </div>
  );
}

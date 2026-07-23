import type { AnalyzedQuote, QuoteAnalysis } from "./quote-analysis.ts";

export function scoreQuote(q: AnalyzedQuote) {
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
    costPerHectare: q.applicationRateKgHa
      ? (q.applicationRateKgHa / q.bagKg) * landedPerBag
      : null,
  };
}

export function nutrientFitScore(q: AnalyzedQuote, analysis: QuoteAnalysis) {
  const plan = analysis.nutrientPlan;
  if (!plan || !q.applicationRateKgHa) return null;

  const targets = [
    Number(plan.targetNitrogenKgHa),
    Number(plan.targetPhosphorusKgHa),
    Number(plan.targetPotassiumKgHa),
  ];
  const supplied = q.npk.map(
    (percentage) => q.applicationRateKgHa! * (percentage / 100),
  );
  const componentScores = targets.flatMap((target, index) => {
    if (!Number.isFinite(target) || target <= 0) return [];
    const difference = Math.abs(supplied[index] - target) / target;
    return [Math.max(0, 100 - difference * 100)];
  });

  if (!componentScores.length) return null;
  return (
    componentScores.reduce((total, score) => total + score, 0) /
    componentScores.length
  );
}

export function fieldFitScore(q: AnalyzedQuote) {
  const base =
    q.agronomicFit === "suitable"
      ? 100
      : q.agronomicFit === "caution"
        ? 55
        : 35;
  if (q.stageFit === "incompatible") return Math.min(base, 15);
  if (q.stageFit === "unknown") return Math.min(base, 55);
  return base;
}

export type RankedQuote = {
  q: AnalyzedQuote;
  s: ReturnType<typeof scoreQuote>;
  nutrientFit: number | null;
  fieldFit: number;
  decisionScore: number;
};

export function rankQuotes(analysis: QuoteAnalysis): RankedQuote[] {
  const scored = analysis.quotes.map((q) => ({
    q,
    s: scoreQuote(q),
    nutrientFit: nutrientFitScore(q, analysis),
    fieldFit: fieldFitScore(q),
    decisionScore: 0,
  }));
  const costValues = scored
    .map((item) => item.s?.costPerKgNutrient)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const lowestCost = Math.min(...costValues);
  const highestCost = Math.max(...costValues);

  for (const item of scored) {
    const costScore =
      item.s && costValues.length
        ? lowestCost === highestCost
          ? 100
          : 100 -
            ((item.s.costPerKgNutrient - lowestCost) /
              (highestCost - lowestCost)) *
              100
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
      hasNutrientPlan
        ? { value: item.nutrientFit!, weight: weights.nutrient }
        : null,
      { value: item.fieldFit, weight: weights.field },
    ].filter(
      (part): part is { value: number; weight: number } => part !== null,
    );
    item.decisionScore =
      weighted.reduce((total, part) => total + part.value * part.weight, 0) /
      weighted.reduce((total, part) => total + part.weight, 0);
  }

  return scored.sort((a, b) => {
    // A quote with no usable price/quantity basis must never outrank a quote
    // whose landed nutrient cost can actually be calculated.
    const comparableDifference = Number(Boolean(b.s)) - Number(Boolean(a.s));
    return comparableDifference || b.decisionScore - a.decisionScore;
  });
}

/**
 * Comparison/ranking language ("Top uploaded comparison", the sort control) is only
 * meaningful when more than one quote was uploaded. With a single quote the result is a
 * fit assessment of that one submitted product, not a ranking among competing quotes.
 */
export function showsComparisonRanking(quoteCount: number): boolean {
  return quoteCount > 1;
}

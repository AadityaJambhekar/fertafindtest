import { localizedHead } from "@/lib/seo-i18n";
import { DEFAULT_LOCALE, segmentToLocale } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocale } from "@/components/locale-context";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Camera,
  Clock,
  Handshake,
  MapPin,
  Sparkles,
  Truck,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Check,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { pageMeta, jsonLdScript, organizationLd, websiteLd, faqLd } from "@/lib/seo";
import {
  listSupplierCompanies,
  supplierBadgeKind,
  SUPPLIER_BADGE_LABEL,
  type Supplier,
  type SupplierBadgeKind,
} from "@/lib/suppliers";

const rotatingPhrases = [
  "worth buying.",
  "right for you.",
  "for healthy crops.",
  "for better yields.",
];
const easterEggPhrase = "Aaditya is the best.";

export const Route = createFileRoute("/$locale/")({
  head: ({ params }) => {
    const locale = segmentToLocale(params.locale) ?? DEFAULT_LOCALE;
    const base = localizedHead(locale, "home", "/");
    return {
      ...base,
      // Homepage structured data: Organization + WebSite, plus a FAQPage generated
      // from the same `faqs` array rendered below so it always mirrors visible content.
      scripts: [
        jsonLdScript(organizationLd()),
        jsonLdScript(websiteLd()),
        jsonLdScript(faqLd(faqs)),
      ],
    };
  },
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <SupplierNetwork />
        <FrequentlyAskedQuestions />
      </main>
      <div className="[&>footer]:mt-0">
        <SiteFooter />
      </div>
    </div>
  );
}

function Hero() {
  const { locale } = useLocale();
  return (
    <section
      className="relative overflow-hidden border-b border-border"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="mx-auto flex min-h-[620px] max-w-6xl items-center justify-center px-4 py-16 sm:min-h-[680px] sm:px-6 sm:py-20">
        <div className="w-full max-w-4xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold">
            <span className="inline-flex items-center gap-2 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered fertilizer intelligence
            </span>
            <a
              href="#suppliers"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Working with Nanofert
              <span aria-hidden="true">↘</span>
            </a>
          </div>
          <h1 className="mt-6 font-display text-[clamp(2.2rem,5vw,3.5rem)] font-medium leading-[1.02] text-foreground">
            <span className="block whitespace-nowrap">Find the fertilizer</span>
            <RotatingPhrase />
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:mt-7 sm:text-lg sm:leading-8">
            Upload a quote. We compare nutrients, price and delivery to find a strong match for your
            crop.
          </p>
          <div className="mt-8 grid gap-3 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:items-center min-[420px]:justify-center sm:mt-10 sm:gap-4">
            <Link
              to="/$locale/analyze"
              params={{ locale }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-soft"
            >
              Analyze for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-7 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              How it works
            </a>
          </div>
          <div className="mx-auto mt-10 grid max-w-2xl gap-3 border-t border-border pt-6 min-[440px]:flex min-[440px]:flex-wrap min-[440px]:justify-center min-[440px]:gap-x-6 sm:mt-12">
            <ProofPoint>Verified partner data</ProofPoint>
            <ProofPoint>Quotes kept separate</ProofPoint>
            <ProofPoint>Missing details flagged</ProofPoint>
          </div>
        </div>
      </div>
    </section>
  );
}

function RotatingPhrase() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [visible, setVisible] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = showEasterEgg ? easterEggPhrase : rotatingPhrases[phraseIndex];
    const complete = visible === phrase;
    const empty = visible.length === 0;
    const delay = complete && !deleting ? 2300 : deleting ? 68 : 112;
    const timer = window.setTimeout(() => {
      if (complete && !deleting) setDeleting(true);
      else if (deleting && empty) {
        setDeleting(false);
        const hitEasterEgg = Math.random() < 1 / 10_000;
        setShowEasterEgg(hitEasterEgg);
        if (!hitEasterEgg) {
          setPhraseIndex((current) => (showEasterEgg ? 0 : (current + 1) % rotatingPhrases.length));
        }
      } else setVisible(phrase.slice(0, visible.length + (deleting ? -1 : 1)));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [deleting, phraseIndex, showEasterEgg, visible]);

  return (
    <span className="rotating-phrase mx-auto block min-h-[1.08em] text-primary" aria-live="polite">
      <span>{visible}</span>
      <span className="typing-cursor" aria-hidden="true" />
    </span>
  );
}

function ProofPoint({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary">
        <Check className="h-3 w-3" />
      </span>
      {children}
    </div>
  );
}

function HowItWorks() {
  const { locale } = useLocale();
  const steps = [
    {
      icon: MapPin,
      title: "Tell us your farm",
      body: "Enter your location, crops, field size and the conditions that affect application.",
    },
    {
      icon: Camera,
      title: "Upload your quotes",
      body: "Snap photos of every fertilizer quote you've received. That's it.",
    },
    {
      icon: Sparkles,
      title: "AI does the math",
      body: "We extract NPK, price per unit, application rates and delivery costs.",
    },
    {
      icon: TrendingUp,
      title: "See the recommendation",
      body: "Get one clear recommended fertilizer, the reason it fits and the supporting costs.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider eyebrow-accent">
          01 / How it works
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
          From quote photo to smart decision — in minutes.
        </h2>
      </div>
      <div className="mt-9 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="group relative rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-foreground hover:shadow-[var(--shadow-soft)] sm:p-6"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl text-muted-foreground/72">0{i + 1}</span>
            </div>
            <h3 className="mt-6 font-display text-xl font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 flex justify-center">
        <Link
          to="/$locale/analyze"
          params={{ locale }}
          className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-primary-soft"
        >
          Start for free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {
      icon: Wallet,
      title: "See nutrient cost on one basis",
      body: "Quotes can look similar until price, pack size and nutrient concentration are put on the same basis. We show that clearly for one quote or several.",
    },
    {
      icon: Truck,
      title: "Landed cost, not sticker price",
      body: "When freight is stated on the quote, it is included so the recommendation reflects the cost of getting product to the farm.",
    },
    {
      icon: TrendingUp,
      title: "Fit-first, not brand-first",
      body: "Recommendations consider the quoted nutrient mix alongside the crop, soil information, weather and watering details you provide.",
    },
    {
      icon: ShieldCheck,
      title: "Important gaps stay visible",
      body: "Missing rates, prices, soil tests or uncertain extraction are flagged instead of being quietly guessed.",
    },
  ];
  return (
    <section
      id="why"
      className="scroll-mt-28 border-y border-border"
      style={{ background: "var(--gradient-warm)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider eyebrow-accent">
              02 / Why farmers use FertaFind
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
              Clearer comparisons. Fewer bad surprises.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Fertilizer is one of the largest cash expenses on the farm. A small decision made
              better each season compounds fast.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-background p-5 transition-colors hover:border-foreground sm:p-6"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SupplierNetwork() {
  const { locale } = useLocale();
  const suppliers = listSupplierCompanies();
  return (
    <section id="suppliers" className="scroll-mt-28 border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider eyebrow-accent">
            03 / Our supplier network
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">
            Our Supplier Network
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            The companies in the FertaFind network — each clearly marked as a FertaFind partner,
            verified from public sources, or pending independent verification.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <HomeSupplierCard key={s.id} supplier={s} />
          ))}
        </div>
        <div className="mt-8">
          <Link
            to="/$locale/suppliers"
            params={{ locale }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold content-accent hover:underline"
          >
            View all suppliers and sourcing origins
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

const HOME_BADGE_STYLE: Record<SupplierBadgeKind, string> = {
  partner: "bg-primary/10 text-primary",
  supplier: "bg-primary/10 text-primary",
  verified: "bg-primary/10 text-primary",
  pending: "bg-amber-100 text-amber-800",
};

function HomeSupplierCard({ supplier }: { supplier: Supplier }) {
  const { locale } = useLocale();
  const kind = supplierBadgeKind(supplier);
  const BadgeIcon = kind === "partner" ? Handshake : kind === "verified" ? ShieldCheck : Clock;
  const place = [supplier.city, supplier.state, supplier.country].filter(Boolean).join(", ");
  return (
    <Link
      to="/$locale/suppliers/$slug"
      params={{ locale, slug: supplier.slug }}
      className="group flex flex-col rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-foreground hover:shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between gap-3">
        {supplier.logo ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-white p-1">
            <img
              src={supplier.logo}
              alt={`${supplier.displayName} logo`}
              className="h-full w-full object-contain"
            />
          </span>
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${HOME_BADGE_STYLE[kind]}`}
        >
          <BadgeIcon className="h-3 w-3" aria-hidden="true" />
          {SUPPLIER_BADGE_LABEL[kind]}
        </span>
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
        {supplier.displayName}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {place || "Location pending verification"}
      </p>
    </Link>
  );
}

const faqs = [
  {
    question: "Does FertaFind recommend the same fertilizer every time?",
    answer:
      "No. Partner products are evaluated against the selected crop, lifecycle stage, soil information, nutrient targets, weather, irrigation, prior applications, preferences, and available supplier evidence.",
  },
  {
    question: "What happens if my crop has no matching partner product?",
    answer:
      "FertaFind will say that no participating partner product currently matches. Your uploaded products can still appear in a separate quote comparison, but they will not be presented as a partner recommendation.",
  },
  {
    question: "Do I need a laboratory soil test?",
    answer:
      "No. A soil test is optional, but it can materially improve the analysis. Without one, missing nutrient and soil-condition information is shown as a limitation rather than guessed.",
  },
  {
    question: "Will the cheapest quote always win?",
    answer:
      "No. Agronomic suitability comes first. Price and delivery are considered only after crop and stage compatibility, and an estimated cost is shown only when enough real pricing information exists.",
  },
];

function FrequentlyAskedQuestions() {
  return (
    <section id="faq" className="scroll-mt-28 border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-9 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[.7fr_1.3fr] lg:gap-12">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider eyebrow-accent">04 / FAQ</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
            Clear answers before you analyze.
          </h2>
          <p className="mt-4 max-w-sm text-muted-foreground">
            What the recommendation does, what it does not do, and where better field data helps.
          </p>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((item) => (
            <details key={item.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-lg font-semibold text-foreground">
                {item.question}
                <span className="text-2xl font-light text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-10 leading-7 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

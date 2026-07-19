import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  MapPin,
  Sparkles,
  Truck,
  TrendingUp,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FertaFind — Best-value fertilizer, backed by AI" },
      {
        name: "description",
        content:
          "Upload your fertilizer quotes and let AI find the highest-ROI fertilizer for your crop and location — with local suppliers and delivery costs factored in.",
      },
      {
        property: "og:title",
        content: "FertaFind — Best-value fertilizer, backed by AI",
      },
      {
        property: "og:description",
        content:
          "Upload your fertilizer quotes and let AI find the highest-ROI fertilizer for your crop and location — with local suppliers and delivery costs factored in.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <Benefits />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden border-b border-border"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="mx-auto grid min-h-[680px] max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_.95fr]">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered fertilizer intelligence for farmers
          </span>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.02] text-foreground md:text-7xl">
            Find the fertilizer
            <br />
            <RotatingPhrase />
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
            Upload a fertilizer quote. Our AI compares nutrients, prices and delivery to find your
            best-value option.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/analyze"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-soft"
            >
              Analyze my quotes
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex h-12 items-center rounded-full border border-border bg-background px-7 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              How it works
            </Link>
          </div>
          <div className="mt-14 grid max-w-lg grid-cols-3 gap-6 text-foreground">
            <Stat value="18%" label="Avg. savings" />
            <Stat value="3 min" label="From photo to answer" />
            <Stat value="ROI" label="Ranked recommendations" />
          </div>
        </div>
        <div className="hidden lg:block" aria-hidden="true" />
      </div>
    </section>
  );
}

function RotatingPhrase() {
  const phrases = ["worth buying.", "best for your farm.", "right for your crop.", "priced for value."];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[phraseIndex];
    const complete = visible === phrase;
    const empty = visible.length === 0;
    const delay = complete && !deleting ? 2300 : deleting ? 68 : 112;
    const timer = window.setTimeout(() => {
      if (complete && !deleting) setDeleting(true);
      else if (deleting && empty) { setDeleting(false); setPhraseIndex((current) => (current + 1) % phrases.length); }
      else setVisible(phrase.slice(0, visible.length + (deleting ? -1 : 1)));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [deleting, phraseIndex, visible]);

  return <span className="rotating-phrase block min-h-[1.08em] text-primary" aria-live="polite"><span>{visible}</span><span className="typing-cursor" aria-hidden="true" /></span>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: MapPin,
      title: "Tell us your farm",
      body: "Enter your location, delivery radius, crop and field size.",
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
      title: "Get the best deal",
      body: "A ranked shortlist by ROI — and you can order the winner through us.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-28">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-primary-soft">
          01 / How it works
        </p>
        <h2 className="mt-2 font-display text-4xl font-semibold text-foreground md:text-5xl">
          From quote photo to smart decision — in minutes.
        </h2>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-foreground hover:shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl text-muted-foreground/40">0{i + 1}</span>
            </div>
            <h3 className="mt-6 font-display text-xl font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {
      icon: Wallet,
      title: "Stop overpaying for nutrients",
      body: "Two quotes might look similar until you break them down per kg of N, P and K. We do that instantly so you never pay for filler again.",
    },
    {
      icon: Truck,
      title: "Delivery costs, in-radius only",
      body: "We only compare suppliers who deliver to your farm and factor freight into every recommendation.",
    },
    {
      icon: TrendingUp,
      title: "Yield-first, not brand-first",
      body: "Every recommendation is scored on ROI for your crop's real nutrient needs — not on which supplier shouts the loudest.",
    },
    {
      icon: ShieldCheck,
      title: "Freedom from bad timing",
      body: "Avoid rushed, cash-heavy fertilizer decisions. Plan ahead with the numbers on your side.",
    },
  ];
  return (
    <section className="border-y border-border" style={{ background: "var(--gradient-warm)" }}>
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              02 / Why farmers use FertaFind
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-foreground md:text-5xl">
              More yield per dollar. Fewer bad surprises.
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
                className="rounded-2xl border border-border bg-background p-6 transition-colors hover:border-foreground"
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

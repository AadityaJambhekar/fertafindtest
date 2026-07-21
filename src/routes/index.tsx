import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  MapPin,
  Sparkles,
  Truck,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Check,
  ExternalLink,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";

const rotatingPhrases = [
  "worth buying.",
  "that fits your farm.",
  "your crop needs.",
  "with the best value.",
];
const easterEggPhrase = "Aaditya is the best.";

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
    links: [{ rel: "canonical", href: "https://fertafind.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "FertaFind",
          url: "https://fertafind.com/",
          description:
            "FertaFind helps growers compare fertilizer quotes, nutrient value, pricing and delivery to identify suitable partner products.",
          logo: "https://fertafind.com/fertafind-logo-transparent.png",
        }),
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
      <PartnerSpotlight />
      <FrequentlyAskedQuestions />
      <div className="[&>footer]:mt-0">
        <SiteFooter />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden border-b border-border"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="mx-auto grid min-h-[620px] max-w-6xl items-center gap-14 px-4 py-16 sm:min-h-[680px] sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr]">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered fertilizer intelligence for farmers
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.02] text-foreground min-[390px]:text-5xl md:text-7xl">
            Find the fertilizer
            <br />
            <RotatingPhrase />
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:mt-7 sm:text-lg sm:leading-8">
            Upload a fertilizer quote. Our AI compares nutrients, prices and delivery to find your
            best fertilizer match.
          </p>
          <div className="mt-8 grid gap-3 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:items-center sm:mt-10 sm:gap-4">
            <Link
              to="/analyze"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-soft"
            >
              Analyze my quotes
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              How it works
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            <strong className="font-extrabold text-foreground">Free to use.</strong> No subscription
            or account required.
          </p>
          <div className="mt-10 grid max-w-2xl gap-3 border-t border-border pt-6 min-[440px]:flex min-[440px]:flex-wrap min-[440px]:gap-x-6 sm:mt-12">
            <ProofPoint>Verified partner data</ProofPoint>
            <ProofPoint>Quotes kept separate</ProofPoint>
            <ProofPoint>Missing details flagged</ProofPoint>
          </div>
        </div>
        <HeroBrandVisual />
      </div>
    </section>
  );
}

function HeroBrandVisual() {
  return (
    <div className="hero-brand-visual hidden lg:flex">
      <div className="hero-brand-mark-wrap">
        <TransparentLogoVideo />
      </div>
    </div>
  );
}

function TransparentLogoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    let animationFrame = 0;
    let lastRenderedAt = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderFrame = (now: number) => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && now - lastRenderedAt >= 32) {
        const scale = Math.min(1, 720 / Math.max(video.videoWidth, 1));
        const width = Math.max(1, Math.round(video.videoWidth * scale));
        const height = Math.max(1, Math.round(video.videoHeight * scale));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        context.drawImage(video, 0, 0, width, height);
        const frame = context.getImageData(0, 0, width, height);
        const pixels = frame.data;
        const samplePoints = [
          [2, 2],
          [width - 3, 2],
          [2, height - 3],
          [width - 3, height - 3],
        ];
        const background = samplePoints.reduce(
          (sum, [x, y]) => {
            const offset = (Math.max(0, y) * width + Math.max(0, x)) * 4;
            sum[0] += pixels[offset];
            sum[1] += pixels[offset + 1];
            sum[2] += pixels[offset + 2];
            return sum;
          },
          [0, 0, 0],
        );
        const backgroundRed = background[0] / samplePoints.length;
        const backgroundGreen = background[1] / samplePoints.length;
        const backgroundBlue = background[2] / samplePoints.length;

        for (let offset = 0; offset < pixels.length; offset += 4) {
          const redDistance = pixels[offset] - backgroundRed;
          const greenDistance = pixels[offset + 1] - backgroundGreen;
          const blueDistance = pixels[offset + 2] - backgroundBlue;
          const distance = Math.sqrt(
            redDistance * redDistance + greenDistance * greenDistance + blueDistance * blueDistance,
          );

          if (distance <= 42) pixels[offset + 3] = 0;
          else if (distance < 88) pixels[offset + 3] = Math.round(((distance - 42) / 46) * 255);
        }

        context.putImageData(frame, 0, 0);
        lastRenderedAt = now;
        if (reducedMotion) {
          video.pause();
          return;
        }
      }
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const start = () => {
      void video.play().catch(() => undefined);
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    video.addEventListener("loadeddata", start, { once: true });
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) start();

    return () => {
      video.removeEventListener("loadeddata", start);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      className="hero-logo-video-shell"
      aria-label="Animated FertaFind logo growing into a plant"
    >
      <video
        ref={videoRef}
        className="hero-logo-video-source"
        src="/fertafind-logo-growth.mp4"
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <canvas ref={canvasRef} className="hero-logo-canvas" aria-hidden="true" />
    </div>
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
    <span className="rotating-phrase block min-h-[1.08em] text-primary" aria-live="polite">
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
        <p className="text-sm font-medium uppercase tracking-wider text-primary-soft">
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
              <span className="font-display text-2xl text-muted-foreground/40">0{i + 1}</span>
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
          to="/analyze"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-primary-soft"
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
      title: "Stop overpaying for nutrients",
      body: "Two quotes can look similar until price, pack size and nutrient concentration are put on the same basis. We show that comparison clearly.",
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
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              02 / Why farmers use FertaFind
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
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

function PartnerSpotlight() {
  return (
    <section id="partners" className="scroll-mt-28 border-b border-border bg-card">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            03 / Our partners
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">
            Fertilizer partners we work with.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            FertaFind evaluates verified products from participating suppliers against your crop,
            lifecycle stage and field information. Our partner network can grow without changing how
            your analysis works.
          </p>
          <div className="mt-7 border-l-2 border-primary pl-5">
            <h3 className="font-display text-2xl font-semibold text-foreground">Nanofert</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Our current participating supplier provides liquid nano-fertilizer products with
              documented crop and lifecycle programs. Rates, availability and final pricing should
              still be confirmed before purchase.
            </p>
          </div>
          <a
            href="https://www.nanofert.com.br/"
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-primary-soft"
          >
            Visit Nanofert
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="rounded-[2rem] border border-border bg-background p-6 shadow-[var(--shadow-soft)] sm:p-9">
          <img
            src="/nanofert-partner.png"
            alt="Nanofert logo"
            className="mx-auto max-h-28 w-full max-w-sm object-contain"
          />
          <div className="mt-6 grid gap-3 text-sm text-muted-foreground min-[420px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <ProofPoint>Crop-stage matching</ProofPoint>
            <ProofPoint>Verified details only</ProofPoint>
          </div>
        </div>
      </div>
    </section>
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
          <p className="text-sm font-medium uppercase tracking-wider text-primary">04 / FAQ</p>
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

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
  FileSearch,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  pageMeta,
  jsonLdScript,
  organizationLd,
  websiteLd,
  faqLd,
} from "@/lib/seo";

const rotatingPhrases = [
  "worth comparing.",
  "that fits your farm.",
  "your crop needs.",
  "at a cost you can see.",
];
const easterEggPhrase = "Aaditya is the best.";

export const Route = createFileRoute("/")({
  head: () => {
    const base = pageMeta("home");
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
      <Hero />
      <HowItWorks />
      <Benefits />
      <Evidence />
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
            Upload a fertilizer quote. Our AI compares nutrients, prices and
            delivery to give you a clear, cost-based comparison.
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
          <div className="mt-12 flex max-w-2xl flex-wrap gap-x-6 gap-y-3 border-t border-border pt-6">
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
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const renderFrame = (now: number) => {
      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        now - lastRenderedAt >= 32
      ) {
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
            redDistance * redDistance +
              greenDistance * greenDistance +
              blueDistance * blueDistance,
          );

          if (distance <= 42) pixels[offset + 3] = 0;
          else if (distance < 88)
            pixels[offset + 3] = Math.round(((distance - 42) / 46) * 255);
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
    const phrase = showEasterEgg
      ? easterEggPhrase
      : rotatingPhrases[phraseIndex];
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
          setPhraseIndex((current) =>
            showEasterEgg ? 0 : (current + 1) % rotatingPhrases.length,
          );
        }
      } else setVisible(phrase.slice(0, visible.length + (deleting ? -1 : 1)));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [deleting, phraseIndex, showEasterEgg, visible]);

  return (
    <span
      className="rotating-phrase block min-h-[1.08em] text-primary"
      aria-live="polite"
    >
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
              <span className="font-display text-2xl text-muted-foreground/40">
                0{i + 1}
              </span>
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
      title: "See nutrient cost on one basis",
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
      className="border-y border-border"
      style={{ background: "var(--gradient-warm)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              02 / Why farmers use FertaFind
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-foreground md:text-5xl">
              Clearer comparisons. Fewer surprises.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Fertilizer is one of the largest cash expenses on the farm. A
              small decision made better each season compounds fast.
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
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Evidence() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="grid items-center gap-10 p-8 md:p-12 lg:grid-cols-[1.2fr_.8fr] lg:p-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              03 / Evidence before claims
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold text-foreground md:text-5xl">
              Recommendations you can trace back to real inputs.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              FertaFind keeps partner-product evidence, your uploaded quotes,
              and missing information clearly separated. When a rate, price,
              crop match, or lifecycle fit is not verified, the result says so.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <ProofPoint>Crop and lifecycle checked</ProofPoint>
              <ProofPoint>Soil and weather considered</ProofPoint>
              <ProofPoint>Prior applications accounted for</ProofPoint>
              <ProofPoint>Unknown values never invented</ProofPoint>
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-background p-8 text-center ring-1 ring-border">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <FileSearch className="h-7 w-7" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Current participating supplier
            </p>
            <img
              src="/nanofert-partner.png"
              alt="Nanofert partner logo"
              className="mx-auto mt-5 max-h-20 w-auto max-w-[220px] object-contain"
            />
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Product matches are limited to documented partner information and
              the selected crop stage.
            </p>
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
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            04 / FAQ
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">
            Clear answers before you analyze.
          </h2>
          <p className="mt-4 max-w-sm text-muted-foreground">
            What the recommendation does, what it does not do, and where better
            field data helps.
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
              <p className="max-w-2xl pb-6 pr-10 leading-7 text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

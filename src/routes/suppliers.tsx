import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CheckCircle2, FlaskConical, Leaf, MapPinned, Wheat } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "FertaFind suppliers — Nanofert" },
      {
        name: "description",
        content:
          "Meet fertilizer suppliers featured by FertaFind and review their crop programs and supplier-reported field results.",
      },
    ],
    links: [{ rel: "canonical", href: "https://fertafind.com/suppliers/" }],
  }),
  component: SuppliersPage,
});

const fieldStats = [
  {
    value: "112",
    label: "soybean field areas",
    detail: "Paired commercial areas reported for the 2025/26 season.",
  },
  {
    value: "87%",
    label: "positive soybean results",
    detail: "Supplier-reported share of areas with a yield gain.",
  },
  {
    value: "+3.5 sc/ha",
    label: "average soybean gain",
    detail: "Reported average across the soybean field dataset.",
  },
  {
    value: "+8.8 sc/ha",
    label: "average corn gain",
    detail: "Supplier-reported average across 11 corn areas.",
  },
];

const cropPrograms = [
  {
    icon: Leaf,
    crop: "Soybean",
    program: "Nano Nitro + Nano Plus",
    timing: "Foliar program around reproductive growth; confirm exact timing locally.",
  },
  {
    icon: Wheat,
    crop: "Corn",
    program: "Nano Nitro + Nano Plus",
    timing: "Reported positioning at V6-V7, approximately 35-40 days after emergence.",
  },
  {
    icon: FlaskConical,
    crop: "Beans",
    program: "Nano Nitro, Nano Phos + Nano Plus",
    timing: "Vegetative nutrition followed by flowering and early pod-formation support.",
  },
  {
    icon: Wheat,
    crop: "Sugarcane",
    program: "Nano Nitro + Nano Plus / Nano-DAP trial programs",
    timing: "Two foliar applications; confirm the specific trial protocol and field stage.",
  },
  {
    icon: Leaf,
    crop: "Lettuce",
    program: "Nano Phos + Nano Plus, then Nano Kali + Nano Plus",
    timing: "Programs positioned around 10-15 and 20-30 days after transplanting.",
  },
  {
    icon: Leaf,
    crop: "Tomato",
    program: "Nano Nitro, Zin, Phos, Plus and Kali",
    timing: "Stage-specific program spanning establishment through fruit growth.",
  },
  {
    icon: Leaf,
    crop: "Pepper",
    program: "Nano Nitro, Zin, Phos, Plus and Kali",
    timing: "Stage-specific program spanning establishment through fruit growth.",
  },
  {
    icon: FlaskConical,
    crop: "Cassava",
    program: "Nano Nitro, Zin, Phos, Plus and Kali",
    timing: "Positioned from establishment through root bulking.",
  },
  {
    icon: Leaf,
    crop: "Table grapes",
    program: "Seven-product lifecycle program",
    timing: "Bud break through flowering, berry growth, maturation and post-harvest.",
  },
];

function SuppliersPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            FertaFind partners
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl">
            Suppliers, shown clearly.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Explore the products and field information shared by fertilizer suppliers available
            through FertaFind. Recommendations still depend on your crop, soil, weather, quote and
            application plan.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <article className="group relative overflow-hidden rounded-[2.25rem] border border-border bg-card shadow-[var(--shadow-lift)]">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#04966f]/15 blur-3xl transition-transform duration-700 group-hover:translate-x-[-2rem] group-hover:translate-y-8" />
            <div className="relative grid lg:grid-cols-[.9fr_1.1fr]">
              <div className="flex min-h-72 items-center justify-center overflow-hidden bg-white p-8 sm:p-12">
                <div className="h-24 w-full max-w-xl overflow-hidden rounded-2xl bg-white">
                  <img
                    src="/nanofert-partner.png"
                    alt="Nanofert"
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
              <div className="relative flex flex-col justify-center bg-[#063d35] p-8 text-white sm:p-12">
                <span className="w-fit rounded-full border border-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                  Featured supplier
                </span>
                <h2 className="mt-5 font-display text-4xl font-semibold">Nanofert</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
                  Foliar nano-fertilizer programs presented for soybean, corn, pasture, beans,
                  sugarcane, fruit and vegetable crops.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/85">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                    <MapPinned className="h-4 w-4" /> Field data from 8 Brazilian states
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                    <BarChart3 className="h-4 w-4" /> 2025/26 commercial results
                  </span>
                </div>
              </div>
            </div>

            <div className="relative border-t border-border p-6 sm:p-10">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {fieldStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#04966f]/50 hover:shadow-[var(--shadow-soft)]"
                  >
                    <p className="font-display text-3xl font-semibold text-[#067e62]">
                      {stat.value}
                    </p>
                    <p className="mt-1 font-semibold text-foreground">{stat.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{stat.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cropPrograms.map((item) => (
                  <div key={item.crop} className="rounded-2xl bg-muted/55 p-5">
                    <item.icon className="h-5 w-5 text-[#067e62]" />
                    <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                      {item.crop}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.program}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.timing}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#04966f]/25 bg-[#04966f]/5 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#067e62]" />
                <p className="text-sm leading-6 text-muted-foreground">
                  <span className="font-semibold text-foreground">Data note: </span>
                  figures above are supplier-reported results from Nanofert&apos;s 2025/26 crop
                  positioning material provided to FertaFind. They are not independent FertaFind
                  trials or guaranteed outcomes. Local conditions, rates and agronomic advice
                  matter.
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

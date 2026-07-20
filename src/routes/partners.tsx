import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Handshake } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "FertaFind partners — Our fertilizer supplier network" },
      {
        name: "description",
        content:
          "Explore FertaFind's participating fertilizer suppliers and partner network, whose products can be matched to growers by crop and field needs.",
      },
    ],
    links: [{ rel: "canonical", href: "https://fertafind.com/partners/" }],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="grid min-h-[68vh] place-items-center px-6 py-20">
        <section className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-primary/25 bg-card px-8 py-16 text-center shadow-[0_24px_80px_rgba(72,184,92,0.18),0_0_55px_rgba(72,184,92,0.12)] md:px-16">
          <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
          <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_35px_rgba(72,184,92,0.35)]">
            <Handshake className="h-7 w-7" />
          </span>
          <p className="relative mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            FertaFind partners
          </p>
          <h1 className="relative mt-3 font-display text-5xl font-semibold tracking-tight">
            Partner page coming soon.
          </h1>
          <p className="relative mx-auto mt-5 max-w-lg text-muted-foreground">
            We’re preparing a home for participating fertilizer suppliers and partner organisations.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/supplier-portal"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Supplier portal <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:fertafind@gmail.com"
              className="inline-flex items-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:border-primary"
            >
              Contact partnerships
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

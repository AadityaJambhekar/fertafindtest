import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About FertaFind — Better fertilizer decisions for growers" },
      {
        name: "description",
        content:
          "FertaFind connects farmers to the best-value fertilizer suppliers in their radius. Learn how we save you money and lift your yield.",
      },
      {
        property: "og:title",
        content: "About FertaFind",
      },
      {
        property: "og:description",
        content: "How FertaFind helps farmers get the highest ROI from every fertilizer dollar.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-wider text-primary-soft">
          About FertaFind
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-foreground md:text-6xl">
          Farmers deserve better fertilizer decisions.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Fertilizer quotes make comparison harder than it should be. Different NPK blends, bag
          sizes, prices and delivery terms can hide the true cost.
        </p>
        <p className="mt-4 text-lg text-muted-foreground">
          Upload your quotes and FertaFind turns them into consistent numbers, then ranks the
          comparable options by value.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <ValueBlock title="Compare clearly" body="See every quote in the same format." />
          <ValueBlock title="See true costs" body="Factor in nutrients, pack size and delivery." />
          <ValueBlock
            title="Choose confidently"
            body="Rank comparable products by delivered value."
          />
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/analyze"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition-all hover:translate-y-[-1px]"
          >
            Try it with your quotes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function ValueBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

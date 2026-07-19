import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      {
        title: "For Suppliers — Reach farmers actively buying fertilizer",
      },
      {
        name: "description",
        content:
          "List your fertilizer products on FertaFind and reach farmers in your delivery radius who are ready to buy.",
      },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-wider text-primary-soft">
          For fertilizer suppliers
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-foreground md:text-6xl">
          Reach farmers ready to buy — in your delivery radius.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          FertaFind shows farmers the best-value fertilizer near them. When
          your product has the highest ROI for their crop, you win the sale.
          No pay-to-play. No banner ads. Just transparent nutrient economics.
        </p>

        <ul className="mt-10 space-y-4">
          {[
            "Reach motivated farmers when they are ready to choose a supplier",
            "Set your delivery radius and pricing — we handle discovery",
            "Every listing is compared on nutrient value, not marketing spend",
            "Reach farmers already committed to buying this season",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Interested in listing?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Create a supplier account, set your depot location and delivery radius, then submit
            your listing for approval.
          </p>
          <Link
            to="/supplier-portal"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:translate-y-[-1px]"
          >
            Create supplier listing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

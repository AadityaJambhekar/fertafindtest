import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { CONTENT_PAGES, RESOURCES, resourcesRouteHead, type ContentSection } from "@/lib/content";

export const Route = createFileRoute("/resources")({
  head: () => resourcesRouteHead(),
  component: ResourcesPage,
});

const GROUPS: Array<{
  section: ContentSection;
  heading: string;
  blurb: string;
}> = [
  {
    section: "guide",
    heading: "Guides",
    blurb:
      "How to put quotes on the same basis and turn prices into per-acre and per-pound figures.",
  },
  {
    section: "comparison",
    heading: "Comparisons",
    blurb: "How common fertilizer products line up against each other on cost and handling.",
  },
  {
    section: "methodology",
    heading: "Methodology",
    blurb: "The public data behind our price comparisons, and its limits.",
  },
];

function ResourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] content-accent">
          Resources
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Fertilizer pricing guides &amp; comparisons
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          {RESOURCES.description} Everything here is about comparing prices fairly — not agronomic
          advice, and never a recommended rate.
        </p>

        {GROUPS.map((group) => {
          const pages = CONTENT_PAGES.filter((p) => p.section === group.section);
          return (
            <section key={group.section} className="mt-12">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                {group.heading}
              </h2>
              <p className="mt-1 text-muted-foreground">{group.blurb}</p>
              <ul className={`mt-5 grid gap-4 ${pages.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {pages.map((p) => (
                  <li key={p.slug}>
                    <a
                      href={p.slug}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-[var(--shadow-soft)]"
                    >
                      <h3 className="font-display text-lg font-semibold text-foreground">{p.h1}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                        {p.description}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold content-accent">
                        Read
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <div className="mt-14 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Ready to compare your own quotes?
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            FertaFind does the conversions from these guides for you — grade, pack size and delivery
            — so your quotes land on one clear, cost-based footing.
          </p>
          <Link
            to="/analyze"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-soft"
          >
            Analyze your quotes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

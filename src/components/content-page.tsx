import { Link } from "@tanstack/react-router";
import { DEFAULT_LOCALE, localeToSegment } from "@/lib/i18n";
import { useDictionary, useLocale, useLocalePath } from "@/components/locale-context";
import type { ReactNode } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { type ContentPage, formatDate } from "@/lib/content";

const SECTION_LABEL: Record<ContentPage["section"], string> = {
  guide: "Guide",
  comparison: "Comparison",
  methodology: "Methodology",
};

export interface RelatedLink {
  label: string;
  href: string;
}

/**
 * Shared chrome for every indexable content page: breadcrumb, one H1, a concise
 * direct answer, the body, a fixed price-vs-agronomy disclaimer, cited sources,
 * internal links and a call to action. Matches the FertaFind design system.
 */
export function ContentPageLayout({
  page,
  answer,
  children,
  related,
  cta,
}: {
  page: ContentPage;
  answer: ReactNode;
  children: ReactNode;
  related: RelatedLink[];
  /** Page-specific closing line above the call to action. */
  cta?: ReactNode;
}) {
  const { locale } = useLocale();
  const t = useDictionary();
  const lp = useLocalePath();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        {/* These long-form articles have not been translated. Say so plainly rather than
            presenting an English body as though it were a Portuguese page. */}
        {locale !== DEFAULT_LOCALE && (
          <p
            lang={DEFAULT_LOCALE}
            className="mb-6 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground"
          >
            {t.notice.untranslatedArticle}
          </p>
        )}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {page.breadcrumb.map((c, i) => {
              const last = i === page.breadcrumb.length - 1;
              return (
                <li key={c.path} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {last ? (
                    <span className="text-foreground" aria-current="page">
                      {c.name}
                    </span>
                  ) : (
                    <a href={lp(c.path)} className="transition-colors hover:text-foreground">
                      {c.name}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] content-accent">
          {SECTION_LABEL[page.section]}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {page.h1}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated {formatDate(page.lastUpdated)}
        </p>

        <section
          aria-label="Short answer"
          className="mt-8 rounded-3xl border border-primary/30 bg-primary/10 p-5 sm:p-6"
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] content-accent">
            Short answer
          </h2>
          <div className="mt-2 text-[1.05rem] leading-8 text-foreground">{answer}</div>
        </section>

        <div className="content-prose mt-10 text-[1.02rem] text-muted-foreground">{children}</div>

        <section className="mt-12 rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Price comparison, not agronomic advice
          </h2>
          <p className="mt-2 leading-7 text-muted-foreground">
            This page helps you compare fertilizer prices on the same basis. It does not recommend
            application rates or products for your field. Rates and nutrient decisions depend on a
            soil test, your crop and growth stage, and local guidance from a qualified agronomist.
            See our{" "}
            <Link
              to="/$locale/terms"
              params={{ locale: localeToSegment(locale) }}
              className="font-medium content-accent hover:underline"
            >
              Terms
            </Link>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-foreground">Sources</h2>
          <ul className="mt-4 space-y-4">
            {page.sources.map((s) => (
              <li key={s.url} className="text-sm leading-6">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium content-accent hover:underline"
                >
                  {s.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <div className="text-muted-foreground">
                  {s.publisher}
                  {s.date ? ` · ${s.date}` : ""} · Accessed {formatDate(s.accessed)}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-foreground">Keep reading</h2>
            <ul className="mt-4 grid gap-2">
              {related.map((r) => (
                <li key={r.href}>
                  <a
                    href={r.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium content-accent transition-colors hover:underline"
                  >
                    {r.label}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-muted-foreground">
            {cta ?? (
              <>Have real quotes in hand? FertaFind puts them on one clear, cost-based footing.</>
            )}
          </p>
          <Link
            to="/$locale/analyze"
            params={{ locale: localeToSegment(locale) }}
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-soft"
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

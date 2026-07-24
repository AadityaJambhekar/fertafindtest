import { useDictionary } from "@/components/locale-context";
import { localizedHead } from "@/lib/seo-i18n";
import { DEFAULT_LOCALE, segmentToLocale } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { pageMeta, jsonLdScript, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/$locale/terms")({
  head: ({ params }) => ({
    ...localizedHead(segmentToLocale(params.locale) ?? DEFAULT_LOCALE, "terms", "/terms"),
    scripts: [
      jsonLdScript(
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Terms", path: "/terms" },
        ]),
      ),
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const t = useDictionary();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          {t.terms.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t.terms.title}
        </h1>
        <p className="mt-4 text-muted-foreground">{t.terms.lastUpdated}</p>

        {/* Legal-translation notice: the English text always controls. */}
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {t.terms.courtesyNotice}
        </p>

        <section className="mt-10 rounded-3xl border border-primary/30 bg-primary/10 p-5 sm:p-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                {t.terms.partnerTitle}
              </h2>
              <p className="mt-2 leading-7 text-muted-foreground">{t.terms.partnerBody}</p>
            </div>
          </div>
        </section>

        <div className="mt-10 space-y-9 text-[1.02rem] leading-8 text-muted-foreground">
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {t.terms.recommendationsTitle}
            </h2>
            <p className="mt-2">{t.terms.recommendationsBody}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {t.terms.decisionTitle}
            </h2>
            <p className="mt-2">{t.terms.decisionBody}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {t.terms.uploadsTitle}
            </h2>
            <p className="mt-2">{t.terms.uploadsBody}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {t.terms.soilTitle}
            </h2>
            <p className="mt-2">{t.terms.soilBody}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {t.terms.purchasesTitle}
            </h2>
            <p className="mt-2">{t.terms.purchasesBody1}</p>
            <p className="mt-3">{t.terms.purchasesBody2}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {t.terms.availabilityTitle}
            </h2>
            <p className="mt-2">{t.terms.availabilityBody}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {t.terms.changesTitle}
            </h2>
            <p className="mt-2">
              {t.terms.changesBody}{" "}
              <a
                href="mailto:fertafind@gmail.com"
                className="font-semibold text-primary hover:underline"
              >
                fertafind@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

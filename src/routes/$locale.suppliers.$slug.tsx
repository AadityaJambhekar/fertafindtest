import { DEFAULT_LOCALE, localeToSegment, segmentToLocale } from "@/lib/i18n";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useDictionary, useLocale, useLocalePath } from "@/components/locale-context";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock,
  ExternalLink,
  Handshake,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  SUPPLIER_TYPE_LABEL,
  supplierBadgeKind,
  getListedSupplierBySlug,
  supplierDetailRouteHead,
  type Supplier,
} from "@/lib/suppliers";

export const Route = createFileRoute("/$locale/suppliers/$slug")({
  // Any LISTED company (partner / verified / source-listed-unverified) resolves. Draft /
  // inactive / unknown slugs are redirected to the network — they can never render a page.
  loader: ({ params }) => {
    const supplier = getListedSupplierBySlug(params.slug);
    if (!supplier) throw redirect({ to: "/$locale/suppliers", params: { locale: params.locale } });
    return { supplier };
  },
  head: (ctx) =>
    ctx.loaderData
      ? supplierDetailRouteHead(
          ctx.loaderData.supplier,
          segmentToLocale(ctx.params.locale) ?? DEFAULT_LOCALE,
        )
      : {},
  component: SupplierDetailPage,
});

function Chips({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] content-accent">{label}</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SupplierLogo({ supplier }: { supplier: Supplier }) {
  if (supplier.logo) {
    return (
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-white p-1.5">
        <img
          src={supplier.logo}
          alt={`${supplier.displayName} logo`}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
      <Building2 className="h-6 w-6" aria-hidden="true" />
    </span>
  );
}

function SupplierDetailPage() {
  const { locale } = useLocale();
  const t = useDictionary();
  const lp = useLocalePath();
  const { supplier } = Route.useLoaderData();
  const country = t.country[supplier.country as keyof typeof t.country] ?? supplier.country;
  const description =
    t.supplierDescription[supplier.slug as keyof typeof t.supplierDescription] ??
    supplier.description;
  const place = [supplier.city, supplier.state, country].filter(Boolean).join(", ");
  const kind = supplierBadgeKind(supplier);
  const BadgeIcon = kind === "partner" ? Handshake : kind === "verified" ? ShieldCheck : Clock;
  const badgeStyle =
    kind === "pending" ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <li>
              <a href={lp("/")} className="transition-colors hover:text-foreground">
                {t.breadcrumb.home}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <a href={lp("/suppliers")} className="transition-colors hover:text-foreground">
                {t.breadcrumb.suppliers}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <span className="text-foreground" aria-current="page">
                {supplier.displayName}
              </span>
            </li>
          </ol>
        </nav>

        <div className="mt-6 flex items-start gap-4">
          <SupplierLogo supplier={supplier} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] content-accent">
                {t.supplierDetail.eyebrow}
              </p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${badgeStyle}`}
              >
                <BadgeIcon className="h-3 w-3" aria-hidden="true" />
                {t.badge[kind]}
              </span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {supplier.displayName}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {SUPPLIER_TYPE_LABEL[supplier.supplierType]}
              {place ? (
                <>
                  {" · "}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {place}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        {kind === "pending" && (
          <div
            role="note"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {t.supplierDetail.pendingTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                {t.supplierDetail.pendingBody.replace("{name}", supplier.displayName)}
              </p>
            </div>
          </div>
        )}

        {/* A "Visit website" link is shown ONLY when a verified website exists. */}
        {(supplier.website || supplier.fertilizerPage) && (
          <div className="mt-5 flex flex-wrap gap-3">
            {supplier.website && (
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {t.common.visitWebsite}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {supplier.fertilizerPage && (
              <a
                href={supplier.fertilizerPage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {t.supplierDetail.fertilizerProducts}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        {description && (
          <p className="mt-6 text-[1.05rem] leading-8 text-foreground">{description}</p>
        )}

        <div className="mt-8 grid gap-6">
          <Chips label={t.suppliers.products} items={supplier.products} />
          <Chips label={t.suppliers.grades} items={supplier.productGrades} />
          <Chips label={t.suppliers.servesRegions} items={supplier.serviceRegions} />
        </div>

        {(supplier.publicEmail || supplier.publicPhone) && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] content-accent">
              {t.supplierDetail.contact}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {supplier.publicEmail && (
                <li className="text-muted-foreground">{supplier.publicEmail}</li>
              )}
              {supplier.publicPhone && (
                <li className="text-muted-foreground">{supplier.publicPhone}</li>
              )}
            </ul>
          </section>
        )}

        {supplier.lastVerifiedAt && (
          <p className="mt-6 text-sm text-muted-foreground">
            {t.supplierDetail.lastVerified.replace("{date}", supplier.lastVerifiedAt)}
          </p>
        )}

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-muted-foreground">
            {t.supplierDetail.haveQuote.replace("{name}", supplier.displayName)}
          </p>
          <Link
            to="/$locale/analyze"
            params={{ locale: localeToSegment(locale) }}
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-soft"
          >
            {t.supplierDetail.analyzeQuote}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-8 text-xs leading-5 text-muted-foreground">{t.suppliers.disclaimer}</p>
      </main>
      <SiteFooter />
    </div>
  );
}

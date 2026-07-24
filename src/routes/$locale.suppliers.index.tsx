import { DEFAULT_LOCALE, segmentToLocale } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Clock, Handshake, MapPin, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { useDictionary, useLocale, useLocalePath } from "@/components/locale-context";
import {
  SUPPLIERS_DIRECTORY,
  SUPPLIER_TYPE_LABEL,
  SUPPLIER_BADGE_LABEL,
  SUPPLIER_DISCOVERY_DISCLAIMER,
  supplierBadgeKind,
  listSupplierCompanies,
  supplierPath,
  suppliersRouteHead,
  type Supplier,
  type SupplierBadgeKind,
} from "@/lib/suppliers";

export const Route = createFileRoute("/$locale/suppliers/")({
  // No validateSearch: the filter bar is gone, so legacy links carrying
  // ?relationship=partner (or any other old filter param) simply load the full
  // directory instead of erroring.
  head: ({ params }) => suppliersRouteHead(segmentToLocale(params.locale) ?? DEFAULT_LOCALE),
  component: SuppliersPage,
});

function SuppliersPage() {
  const lp = useLocalePath();
  const { locale } = useLocale();
  const t = useDictionary();
  const companies = listSupplierCompanies();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <li>
              <a href={lp("/")} className="transition-colors hover:text-foreground">
                {t.breadcrumb.home}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <span className="text-foreground" aria-current="page">
                {t.breadcrumb.suppliers}
              </span>
            </li>
          </ol>
        </nav>

        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] content-accent">
          {t.suppliers.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t.suppliers.title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          {t.suppliers.description} {t.suppliers.disclaimer}
        </p>

        {/* Supplier cards sit directly beneath the introduction. */}
        <section className="mt-7" aria-labelledby="supplier-companies-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="supplier-companies-heading"
              className="font-display text-2xl font-semibold text-foreground"
            >
              {t.suppliers.companiesHeading}
            </h2>
            <p className="text-sm text-muted-foreground">
              {companies.length}{" "}
              {companies.length === 1 ? t.suppliers.companyOne : t.suppliers.companyMany}
            </p>
          </div>

          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((s) => (
              <li key={s.id}>
                <SupplierCard supplier={s} />
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            {t.suppliers.ctaTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t.suppliers.ctaBody}</p>
          <Link
            to="/$locale/analyze"
            params={{ locale }}
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-soft"
          >
            {t.home.heroCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

const BADGE_STYLE: Record<SupplierBadgeKind, string> = {
  partner: "bg-primary/10 text-primary",
  supplier: "bg-primary/10 text-primary",
  verified: "bg-primary/10 text-primary",
  pending: "bg-amber-100 text-amber-800",
};

function SupplierBadge({ kind }: { kind: SupplierBadgeKind }) {
  const t = useDictionary();
  const Icon = kind === "partner" ? Handshake : kind === "verified" ? ShieldCheck : Clock;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${BADGE_STYLE[kind]}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t.badge[kind]}
    </span>
  );
}

function SupplierLogo({ supplier }: { supplier: Supplier }) {
  if (supplier.logo) {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-white p-1">
        <img
          src={supplier.logo}
          alt={`${supplier.displayName} logo`}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
      <Building2 className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

function SupplierCard({ supplier }: { supplier: Supplier }) {
  const t = useDictionary();
  const country = t.country[supplier.country as keyof typeof t.country] ?? supplier.country;
  // Translated prose when we have it; otherwise the registry's own English description.
  const description =
    t.supplierDescription[supplier.slug as keyof typeof t.supplierDescription] ??
    supplier.description;
  const place = [supplier.city, supplier.state, country].filter(Boolean).join(", ");
  const kind = supplierBadgeKind(supplier);
  return (
    <Link
      to={supplierPath(supplier.slug)}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between gap-3">
        <SupplierLogo supplier={supplier} />
        <SupplierBadge kind={kind} />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
        {supplier.displayName}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{t.supplierType[supplier.supplierType]}</p>
      {place && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {place}
        </p>
      )}
      {description && (
        <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      {kind === "pending" && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          This listing is not independently verified. Company and product details are pending
          verification.
        </p>
      )}
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold content-accent">
        {t.suppliers.viewSupplier}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

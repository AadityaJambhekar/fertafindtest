import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Clock, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  SUPPLIER_TYPE_LABEL,
  VERIFICATION_BADGE,
  SUPPLIER_DISCOVERY_DISCLAIMER,
  getListedSupplierBySlug,
  supplierDetailRouteHead,
} from "@/lib/suppliers";

export const Route = createFileRoute("/suppliers/$slug")({
  // Any LISTED company (verified or source-listed-unverified) resolves. Draft / inactive /
  // unknown slugs are redirected to the directory — they can never render a detail page.
  loader: ({ params }) => {
    const supplier = getListedSupplierBySlug(params.slug);
    if (!supplier) throw redirect({ to: "/suppliers" });
    return { supplier };
  },
  head: (ctx) => (ctx.loaderData ? supplierDetailRouteHead(ctx.loaderData.supplier) : {}),
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

function SupplierDetailPage() {
  const { supplier } = Route.useLoaderData();
  const place = [supplier.city, supplier.state, supplier.country].filter(Boolean).join(", ");
  const isVerified = supplier.verificationStatus === "public-source-verified";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <li>
              <a href="/" className="transition-colors hover:text-foreground">
                Home
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <a href="/suppliers" className="transition-colors hover:text-foreground">
                Suppliers
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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] content-accent">
            Supplier
          </p>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {VERIFICATION_BADGE["public-source-verified"]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {VERIFICATION_BADGE["source-listed-unverified"]}
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
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

        {!isVerified && (
          <div
            role="note"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Information pending verification
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                {supplier.displayName}&apos;s information has not been independently verified by
                FertaFind. It is listed from source material provided to us. Company details,
                products, contacts and website are not confirmed and are intentionally left blank
                until verified.
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
                Visit website
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
                Fertilizer products
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        {supplier.description && (
          <p className="mt-6 text-[1.05rem] leading-8 text-foreground">{supplier.description}</p>
        )}

        <div className="mt-8 grid gap-6">
          <Chips label="Products" items={supplier.products} />
          <Chips label="Product grades" items={supplier.productGrades} />
          <Chips label="Service regions" items={supplier.serviceRegions} />
        </div>

        {(supplier.publicEmail || supplier.publicPhone) && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] content-accent">
              Contact
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
            Details last verified {supplier.lastVerifiedAt}.
          </p>
        )}

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-muted-foreground">
            Have a quote from {supplier.displayName}? FertaFind puts it on one clear, cost-based
            footing alongside your other quotes.
          </p>
          <Link
            to="/analyze"
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-soft"
          >
            Analyze a quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-8 text-xs leading-5 text-muted-foreground">
          {SUPPLIER_DISCOVERY_DISCLAIMER}
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

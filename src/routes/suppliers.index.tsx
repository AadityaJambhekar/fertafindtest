import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, Clock, Globe2, Handshake, MapPin, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  SUPPLIERS_DIRECTORY,
  SUPPLIER_TYPE_LABEL,
  SUPPLIER_BADGE_LABEL,
  SOURCING_DISCLAIMER,
  SUPPLIER_DISCOVERY_DISCLAIMER,
  supplierBadgeKind,
  listSupplierCompanies,
  listSourcingOrigins,
  directoryFilterOptions,
  filterSupplierCompanies,
  filterSourcingOrigins,
  supplierPath,
  suppliersRouteHead,
  type Supplier,
  type SourcingOrigin,
  type SupplierBadgeKind,
  type SupplierDirectoryFilters,
} from "@/lib/suppliers";

type SuppliersSearch = { relationship?: "partner" };

export const Route = createFileRoute("/suppliers/")({
  validateSearch: (search: Record<string, unknown>): SuppliersSearch =>
    search.relationship === "partner" ? { relationship: "partner" } : {},
  head: () => suppliersRouteHead(),
  component: SuppliersPage,
});

const EMPTY_FILTERS: SupplierDirectoryFilters = {
  relationship: "",
  verification: "",
  type: "",
  product: "",
  origin: "",
};

function SuppliersPage() {
  const { relationship } = Route.useSearch();
  const companies = listSupplierCompanies();
  const origins = listSourcingOrigins();
  const options = directoryFilterOptions();
  const [filters, setFilters] = useState<SupplierDirectoryFilters>({
    ...EMPTY_FILTERS,
    relationship: relationship === "partner" ? "partner" : "",
  });

  const filteredCompanies = useMemo(
    () => filterSupplierCompanies(companies, filters),
    [companies, filters],
  );
  const filteredOrigins = useMemo(
    () => filterSourcingOrigins(origins, filters),
    [origins, filters],
  );

  const isFiltering =
    filters.relationship !== "" ||
    filters.verification !== "" ||
    filters.type !== "" ||
    filters.product !== "" ||
    filters.origin !== "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <li>
              <a href="/" className="transition-colors hover:text-foreground">
                Home
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <span className="text-foreground" aria-current="page">
                Suppliers
              </span>
            </li>
          </ol>
        </nav>

        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] content-accent">
          Supplier network
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Our Supplier Network
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          {SUPPLIERS_DIRECTORY.description} {SUPPLIER_DISCOVERY_DISCLAIMER}
        </p>

        {/* Section 1: the supplier companies — shown up front, before the filters. */}
        <section className="mt-7" aria-labelledby="supplier-companies-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="supplier-companies-heading"
              className="font-display text-2xl font-semibold text-foreground"
            >
              Supplier companies
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"}
            </p>
          </div>

          {filteredCompanies.length > 0 ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((s) => (
                <li key={s.id}>
                  <SupplierCard supplier={s} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              No supplier companies match the current filters.
            </p>
          )}
        </section>

        {/* Filters — placed below the first supplier-card section. */}
        <div className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
          <FilterSelect
            label="Relationship"
            value={filters.relationship}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                relationship: v as SupplierDirectoryFilters["relationship"],
              }))
            }
            entries={[{ value: "partner", label: SUPPLIER_BADGE_LABEL.partner }]}
          />
          <FilterSelect
            label="Verification"
            value={filters.verification}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                verification: v as SupplierDirectoryFilters["verification"],
              }))
            }
            entries={[
              { value: "verified", label: "Verified" },
              { value: "pending", label: "Pending verification" },
            ]}
          />
          <FilterSelect
            label="Supplier type"
            value={filters.type}
            onChange={(v) =>
              setFilters((f) => ({ ...f, type: v as SupplierDirectoryFilters["type"] }))
            }
            entries={options.supplierTypes.map((t) => ({
              value: t,
              label: SUPPLIER_TYPE_LABEL[t],
            }))}
          />
          <FilterSelect
            label="Product"
            value={filters.product}
            onChange={(v) => setFilters((f) => ({ ...f, product: v }))}
            entries={options.products.map((p) => ({ value: p, label: p }))}
          />
          <FilterSelect
            label="Country or origin"
            value={filters.origin}
            onChange={(v) => setFilters((f) => ({ ...f, origin: v }))}
            entries={options.origins.map((o) => ({ value: o, label: o }))}
          />
          {isFiltering && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="ml-auto h-9 rounded-lg border border-border px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Section 2: Global sourcing origins — kept below the supplier companies. */}
        <section className="mt-12" aria-labelledby="sourcing-origins-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="sourcing-origins-heading"
              className="font-display text-2xl font-semibold text-foreground"
            >
              Global sourcing origins
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredOrigins.length} {filteredOrigins.length === 1 ? "origin" : "origins"}
            </p>
          </div>
          <p className="mt-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
            {SOURCING_DISCLAIMER}
          </p>

          {filteredOrigins.length > 0 ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOrigins.map((o) => (
                <li key={`${o.origin}-${o.product}`}>
                  <SourcingOriginCard origin={o} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              {filters.relationship !== "" || filters.verification !== "" || filters.type !== ""
                ? "Sourcing origins are hidden while a supplier-only filter (relationship, verification or supplier type) is active."
                : "No sourcing origins match the current filters."}
            </p>
          )}
        </section>

        <div className="mt-16 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Already have quotes from a supplier?
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            FertaFind puts every fertilizer quote on one clear, cost-based footing — grade, pack
            size and delivery — so you can compare them fairly.
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

function FilterSelect({
  label,
  value,
  onChange,
  entries,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  entries: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      >
        <option value="">All</option>
        {entries.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const BADGE_STYLE: Record<SupplierBadgeKind, string> = {
  partner: "bg-primary/10 text-primary",
  verified: "bg-primary/10 text-primary",
  pending: "bg-amber-100 text-amber-800",
};

function SupplierBadge({ kind }: { kind: SupplierBadgeKind }) {
  const Icon = kind === "partner" ? Handshake : kind === "verified" ? ShieldCheck : Clock;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${BADGE_STYLE[kind]}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {SUPPLIER_BADGE_LABEL[kind]}
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
  const place = [supplier.city, supplier.state, supplier.country].filter(Boolean).join(", ");
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
      <p className="mt-1 text-sm text-muted-foreground">
        {SUPPLIER_TYPE_LABEL[supplier.supplierType]}
      </p>
      {place && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {place}
        </p>
      )}
      {supplier.description && (
        <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
          {supplier.description}
        </p>
      )}
      {kind === "pending" && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          This listing is not independently verified. Company and product details are pending
          verification.
        </p>
      )}
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold content-accent">
        View supplier
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function SourcingOriginCard({ origin }: { origin: SourcingOrigin }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-dashed border-border bg-background p-5">
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Globe2 className="h-3 w-3" aria-hidden="true" />
        Sourcing origin
      </span>
      <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{origin.origin}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{origin.product}</p>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Market-discovery reference only — not a verified supplier company.
      </p>
    </div>
  );
}

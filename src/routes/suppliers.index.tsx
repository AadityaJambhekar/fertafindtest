import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, List, Map as MapIcon, MapPin, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { GoogleMap, type GoogleMapMarker } from "@/components/google-map";
import {
  SUPPLIERS_DIRECTORY,
  SUPPLIER_TYPE_LABEL,
  listPublicSuppliers,
  supplierFilterOptions,
  supplierPath,
  suppliersRouteHead,
  type Supplier,
} from "@/lib/suppliers";

export const Route = createFileRoute("/suppliers/")({
  head: () => suppliersRouteHead(),
  component: SuppliersPage,
});

interface Filters {
  product: string;
  grade: string;
  type: string;
  country: string;
  region: string;
  verifiedOnly: boolean;
}

const EMPTY_FILTERS: Filters = {
  product: "",
  grade: "",
  type: "",
  country: "",
  region: "",
  verifiedOnly: false,
};

function matches(s: Supplier, f: Filters): boolean {
  if (f.product && !s.products.includes(f.product)) return false;
  if (f.grade && !s.productGrades.includes(f.grade)) return false;
  if (f.type && s.supplierType !== f.type) return false;
  if (f.country && s.country !== f.country) return false;
  if (f.region && !s.serviceRegions.includes(f.region)) return false;
  if (f.verifiedOnly && !s.verified) return false;
  return true;
}

function SuppliersPage() {
  // Only public, verified, complete records are ever exposed here.
  const all = listPublicSuppliers();
  const options = supplierFilterOptions();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [view, setView] = useState<"list" | "map">("list");

  const filtered = useMemo(() => all.filter((s) => matches(s, filters)), [all, filters]);
  const markers: GoogleMapMarker[] = useMemo(
    () =>
      filtered
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => ({
          id: s.id,
          lat: s.latitude as number,
          lng: s.longitude as number,
          title: s.displayName,
        })),
    [filtered],
  );

  const hasSuppliers = all.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
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

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] content-accent">
          Directory
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Fertilizer suppliers
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          {SUPPLIERS_DIRECTORY.description}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Supplier information is provided for discovery and does not imply endorsement or
          partnership.
        </p>

        {hasSuppliers ? (
          <>
            <div className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
              <FilterSelect
                label="Product"
                value={filters.product}
                onChange={(v) => setFilters((f) => ({ ...f, product: v }))}
                options={options.products}
              />
              <FilterSelect
                label="Grade"
                value={filters.grade}
                onChange={(v) => setFilters((f) => ({ ...f, grade: v }))}
                options={options.productGrades}
              />
              <FilterSelect
                label="Type"
                value={filters.type}
                onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
                options={options.supplierTypes}
                labels={SUPPLIER_TYPE_LABEL}
              />
              <FilterSelect
                label="Country"
                value={filters.country}
                onChange={(v) => setFilters((f) => ({ ...f, country: v }))}
                options={options.countries}
              />
              <FilterSelect
                label="Service region"
                value={filters.region}
                onChange={(v) => setFilters((f) => ({ ...f, region: v }))}
                options={options.serviceRegions}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-primary"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, verifiedOnly: e.target.checked }))}
                />
                Verified only
              </label>
              <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5">
                <ViewToggle
                  active={view === "list"}
                  onClick={() => setView("list")}
                  icon={<List className="h-4 w-4" />}
                  label="List"
                />
                <ViewToggle
                  active={view === "map"}
                  onClick={() => setView("map")}
                  icon={<MapIcon className="h-4 w-4" />}
                  label="Map"
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "supplier" : "suppliers"}
            </p>

            {view === "map" ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <GoogleMap
                  center={markers.length ? { lat: markers[0].lat, lng: markers[0].lng } : null}
                  markers={markers}
                  height="28rem"
                  emptyFallback={
                    <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground">
                      Map view needs supplier coordinates. Use the list view above.
                    </div>
                  }
                />
              </div>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {filtered.map((s) => (
                  <li key={s.id}>
                    <SupplierCard supplier={s} />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <section className="mt-10 rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
              Verified suppliers are being added
            </h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              We list a supplier only after its details — products, location and contact information
              — have been independently verified. We are building that list now, so no public
              suppliers appear here yet. Please check back soon.
            </p>
            <Link
              to="/analyze"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-soft"
            >
              Analyze your quotes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        <div className="mt-14 rounded-3xl border border-border bg-card p-6 sm:p-8">
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
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
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
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SupplierCard({ supplier }: { supplier: Supplier }) {
  const place = [supplier.city, supplier.state, supplier.country].filter(Boolean).join(", ");
  return (
    <Link
      to={supplierPath(supplier.slug)}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {supplier.displayName}
        </h3>
        {supplier.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Public information verified
          </span>
        )}
      </div>
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
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold content-accent">
        View supplier
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

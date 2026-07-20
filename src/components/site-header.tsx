import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <BrandMark className="h-12 w-12" />
          <span className="hidden font-display text-xl font-bold tracking-[-0.04em] text-foreground sm:inline">
            FertaFind
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground" }}
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            About
          </Link>
          <Link
            to="/suppliers"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Suppliers
          </Link>
        </nav>
        <div className="flex items-center">
          <Link
            to="/analyze"
            className="inline-flex h-11 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-primary-soft sm:px-6 sm:text-sm"
          >
            Analyze quotes
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <BrandMark className="h-12 w-12" alt="" />
            <span className="font-display text-xl font-semibold">FertaFind</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-primary-foreground/70">
            Smarter fertilizer decisions for growers. Best value nutrients, delivered.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-display text-base">Product</h4>
          <ul className="mt-3 space-y-2 text-primary-foreground/70">
            <li>
              <Link to="/analyze" className="hover:text-primary-foreground">
                Analyze quotes
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary-foreground">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/suppliers" className="hover:text-primary-foreground">
                Suppliers
              </Link>
            </li>
            <li>
              <Link to="/partners" className="hover:text-primary-foreground">
                Partners
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary-foreground">
                Terms
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-display text-base">Contact</h4>
          <p className="mt-3 text-primary-foreground/70">fertafind@gmail.com</p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} FertaFind. All rights reserved.
      </div>
    </footer>
  );
}

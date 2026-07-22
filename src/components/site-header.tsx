import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-2">
          <BrandMark className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" />
          <span className="hidden truncate font-display text-lg font-bold tracking-[-0.04em] text-foreground min-[360px]:inline sm:text-xl">
            FertaFind
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Homepage sections">
          <a
            href="/#how"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="/#why"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Why FertaFind
          </a>
          <a
            href="/#partners"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Partners
          </a>
          <a
            href="/#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </a>
        </nav>
        <div className="flex items-center">
          <Link
            to="/analyze"
            className="inline-flex h-10 shrink-0 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-primary-soft sm:h-11 sm:px-6 sm:text-sm"
          >
            Analyze quotes
          </Link>
        </div>
      </div>
      <nav
        className="flex items-center justify-center gap-5 overflow-x-auto border-t border-border/70 px-4 py-2.5 md:hidden"
        aria-label="Homepage sections"
      >
        <a href="/#how" className="shrink-0 text-xs font-semibold text-muted-foreground">
          How it works
        </a>
        <a href="/#why" className="shrink-0 text-xs font-semibold text-muted-foreground">
          Why FertaFind
        </a>
        <a href="/#partners" className="shrink-0 text-xs font-semibold text-muted-foreground">
          Partners
        </a>
        <a href="/#faq" className="shrink-0 text-xs font-semibold text-muted-foreground">
          FAQ
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <BrandMark className="h-12 w-12" />
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
              <a href="/#how" className="hover:text-primary-foreground">
                How it works
              </a>
            </li>
            <li>
              <a href="/#partners" className="hover:text-primary-foreground">
                Partners
              </a>
            </li>
            <li>
              <a href="/#faq" className="hover:text-primary-foreground">
                FAQ
              </a>
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

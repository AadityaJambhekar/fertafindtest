import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useDictionary, useLocale, useLocalePath } from "@/components/locale-context";

export function SiteHeader() {
  const t = useDictionary();
  const { locale } = useLocale();
  const lp = useLocalePath();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-6">
        <Link to="/$locale" params={{ locale }} className="group flex min-w-0 items-center gap-2">
          <BrandMark className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" />
          <span className="hidden truncate font-display text-lg font-bold tracking-[-0.04em] text-foreground min-[360px]:inline sm:text-xl">
            FertaFind
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Homepage sections">
          <a
            href={`${lp("/")}#how`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.howItWorks}
          </a>
          <a
            href={`${lp("/")}#why`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.whyFertafind}
          </a>
          <Link
            to="/$locale/suppliers"
            params={{ locale }}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.suppliers}
          </Link>
          <a
            href={`${lp("/")}#faq`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.faq}
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="hidden md:inline-flex" />
          <Link
            to="/$locale/analyze"
            params={{ locale }}
            className="inline-flex h-10 shrink-0 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-primary-soft sm:h-11 sm:px-6 sm:text-sm"
          >
            {t.nav.analyzeQuotes}
          </Link>
        </div>
      </div>
      <nav
        className="flex items-center justify-center gap-5 overflow-x-auto border-t border-border/70 px-4 py-2.5 md:hidden"
        aria-label="Homepage sections"
      >
        <a href={`${lp("/")}#how`} className="shrink-0 text-xs font-semibold text-muted-foreground">
          {t.nav.howItWorks}
        </a>
        <a href={`${lp("/")}#why`} className="shrink-0 text-xs font-semibold text-muted-foreground">
          {t.nav.whyFertafind}
        </a>
        <Link
          to="/$locale/suppliers"
          params={{ locale }}
          className="shrink-0 text-xs font-semibold text-muted-foreground"
        >
          {t.nav.suppliers}
        </Link>
        <a href={`${lp("/")}#faq`} className="shrink-0 text-xs font-semibold text-muted-foreground">
          {t.nav.faq}
        </a>
        <LanguageSwitcher className="shrink-0" />
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const t = useDictionary();
  const { locale } = useLocale();
  const lp = useLocalePath();

  return (
    <footer className="mt-24 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <BrandMark className="h-12 w-12" />
            <span className="font-display text-xl font-semibold">FertaFind</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-primary-foreground/80">{t.footer.tagline}</p>
        </div>
        <div className="text-sm">
          <h2 className="font-display text-base">{t.footer.productHeading}</h2>
          <ul className="mt-3 space-y-2 text-primary-foreground/80">
            <li>
              <Link
                to="/$locale/analyze"
                params={{ locale }}
                className="hover:text-primary-foreground"
              >
                {t.nav.analyzeQuotes}
              </Link>
            </li>
            <li>
              <a href={`${lp("/")}#how`} className="hover:text-primary-foreground">
                {t.nav.howItWorks}
              </a>
            </li>
            <li>
              <a
                href={`${lp("/suppliers")}?relationship=partner`}
                className="hover:text-primary-foreground"
              >
                {t.footer.partners}
              </a>
            </li>
            <li>
              <a href={`${lp("/")}#faq`} className="hover:text-primary-foreground">
                {t.nav.faq}
              </a>
            </li>
            <li>
              <a href={lp("/resources")} className="hover:text-primary-foreground">
                {t.nav.resources}
              </a>
            </li>
            <li>
              <Link
                to="/$locale/terms"
                params={{ locale }}
                className="hover:text-primary-foreground"
              >
                {t.nav.terms}
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h2 className="font-display text-base">{t.footer.contactHeading}</h2>
          <p className="mt-3 text-primary-foreground/80">fertafind@gmail.com</p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/80">
        © {new Date().getFullYear()} FertaFind. {t.footer.rights}
      </div>
    </footer>
  );
}

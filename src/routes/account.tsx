import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({ component: AccountPage });

const TERMS_VERSION = "2026-07-18";
const OAUTH_TERMS_KEY = "fertafind:pending-terms-acceptance";

type Profile = { display_name: string | null; role: "farmer" | "supplier" | "admin" };

function AccountPage() {
  const [accountMode, setAccountMode] = useState<"create" | "signin">("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: Record<string, string>;
  } | null>(null);
  const [profile, setProfile] = useState<Profile>({ display_name: null, role: "farmer" });
  const [name, setName] = useState("");

  useEffect(() => {
    const recordTermsAcceptance = async (userId: string, method: "password" | "google") => {
      const acceptedAt = new Date().toISOString();
      await supabase.auth.updateUser({
        data: { terms_version: TERMS_VERSION, terms_accepted_at: acceptedAt },
      });
      // Generated Supabase types have not yet been refreshed after the account migrations.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("terms_acceptances").insert({
        user_id: userId,
        terms_version: TERMS_VERSION,
        acceptance_method: method,
      });
    };

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      setUser(currentUser as typeof user);
      if (!currentUser) return;

      if (window.localStorage.getItem(OAUTH_TERMS_KEY) === TERMS_VERSION) {
        window.localStorage.removeItem(OAUTH_TERMS_KEY);
        await recordTermsAcceptance(currentUser.id, "google");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: savedProfile } = await (supabase as any)
        .from("profiles")
        .select("display_name, role")
        .eq("id", currentUser.id)
        .maybeSingle();
      const next = savedProfile ?? {
        display_name:
          currentUser.user_metadata?.full_name ?? currentUser.user_metadata?.name ?? null,
        role: "farmer",
      };
      setProfile(next);
      setName(next.display_name ?? "");
    };

    void load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void load());
    return () => listener.subscription.unsubscribe();
  }, []);

  const authenticateWithPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (accountMode === "create" && !acceptedTerms) {
      setMessage("Please agree to the Terms of Service before creating an account.");
      return;
    }
    if (password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }
    if (accountMode === "create" && password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setBusy(true);
    if (accountMode === "create") {
      const acceptedAt = new Date().toISOString();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { terms_version: TERMS_VERSION, terms_accepted_at: acceptedAt },
        },
      });
      if (!error && data.user && data.session) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("terms_acceptances").insert({
          user_id: data.user.id,
          terms_version: TERMS_VERSION,
          acceptance_method: "password",
        });
      }
      setMessage(
        error
          ? error.message
          : data.session
            ? "Your account is ready."
            : "Account created. Supabase email confirmation is still enabled; turn it off in Authentication settings for immediate sign-in.",
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error ? error.message : "Signed in.");
    }
    setBusy(false);
  };

  const google = async () => {
    setMessage("");
    if (accountMode === "create" && !acceptedTerms) {
      setMessage("Please agree to the Terms of Service before creating an account.");
      return;
    }
    setBusy(true);
    if (accountMode === "create") {
      window.localStorage.setItem(OAUTH_TERMS_KEY, TERMS_VERSION);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
    if (error) {
      window.localStorage.removeItem(OAUTH_TERMS_KEY);
      setMessage(error.message);
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      setMessage("Enter your email address first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    });
    setMessage(error ? error.message : "Password reset instructions have been sent.");
    setBusy(false);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setMessage("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("profiles").upsert({
      id: user.id,
      display_name: name.trim() || null,
      role: profile.role,
    });
    if (!error) {
      setProfile((current) => ({ ...current, display_name: name.trim() || null }));
    }
    setMessage(error ? error.message : "Profile saved.");
    setBusy(false);
  };

  const signOut = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    setUser(null);
    setMessage("");
    setBusy(false);
  };

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> My FertaFind
          </span>
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_0.8fr]">
            <section className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="font-display text-3xl font-semibold">Your profile</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <form onSubmit={saveProfile} className="mt-7">
                <label className="text-sm font-medium">
                  Name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"
                  />
                </label>
                <p className="mt-3 text-xs text-muted-foreground">
                  Your account is set up as a {profile.role}.
                </p>
                <button
                  disabled={busy}
                  className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  Save profile
                </button>
              </form>
              {message && (
                <p className="mt-4 flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {message}
                </p>
              )}
            </section>
            <aside className="rounded-3xl bg-primary p-7 text-primary-foreground">
              <BrandMark className="h-14 w-14" />
              <h2 className="mt-6 font-display text-2xl font-semibold">Ready to compare?</h2>
              <p className="mt-2 text-sm text-primary-foreground/75">
                Your analyses are saved while you are signed in.
              </p>
              <Link
                to="/analyze"
                className="mt-6 inline-flex rounded-full bg-background px-5 py-3 text-sm font-semibold text-foreground"
              >
                Analyze quotes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </aside>
          </div>
          <section className="mt-6 rounded-3xl border border-border bg-card p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-2xl font-semibold">Supplier tools</h2>
                </div>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Create a supplier listing and submit products for review.
                </p>
              </div>
              <Link
                to="/supplier-portal"
                className="inline-flex shrink-0 rounded-full border border-border px-5 py-3 text-sm font-semibold hover:border-primary"
              >
                {profile.role === "supplier" ? "Manage supplier listing" : "Become a supplier"}
              </Link>
            </div>
          </section>
          <button
            onClick={signOut}
            disabled={busy}
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-4">
            <BrandMark className="h-14 w-14" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                FertaFind
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Account</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Save quote comparisons and manage your profile.
          </p>
          <section className="mt-6 rounded-[1.75rem] border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <div
              className="grid grid-cols-2 rounded-full bg-muted p-1"
              aria-label="Choose account action"
            >
              {(["create", "signin"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setAccountMode(mode);
                    setMessage("");
                  }}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${accountMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {mode === "create" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>
            <div className="mt-7">
              <h2 className="font-display text-2xl font-semibold">
                {accountMode === "create" ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {accountMode === "create"
                  ? "Use a password or continue with Google."
                  : "Enter your email and password."}
              </p>
            </div>
            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:border-primary/50 hover:bg-muted/40 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-xs text-background">
                  G
                </span>
              )}
              {accountMode === "create" ? "Create with Google" : "Sign in with Google"}
            </button>
            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
              or use email
            </div>
            <form onSubmit={authenticateWithPassword} className="space-y-4">
              <label className="block text-sm font-medium">
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>
              <label className="block text-sm font-medium">
                Password
                <span className="relative mt-2 block">
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    autoComplete={accountMode === "create" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>
              {accountMode === "create" && (
                <label className="block text-sm font-medium">
                  Confirm password
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>
              )}
              {accountMode === "create" && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/35 p-4 text-sm leading-5">
                  <input
                    required
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      target="_blank"
                      className="font-semibold text-primary hover:underline"
                    >
                      Terms of Service
                    </Link>
                    .
                  </span>
                </label>
              )}
              <button
                disabled={busy || (accountMode === "create" && !acceptedTerms)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-soft disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {accountMode === "create" ? "Create account" : "Sign in"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {accountMode === "signin" && (
              <button
                type="button"
                onClick={resetPassword}
                disabled={busy}
                className="mt-4 w-full text-center text-xs font-semibold text-muted-foreground hover:text-primary"
              >
                Forgot your password?
              </button>
            )}
            {message && (
              <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

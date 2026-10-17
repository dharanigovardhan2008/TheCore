"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Brand from "@/components/ui/Brand";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";

type Mode = "login" | "signup" | "complete_google_signup" | "check_email";

const PROFESSIONS = [
  "Software Developer",
  "Student",
  "Indie Hacker / Founder",
  "UI/UX Designer",
  "Freelancer",
  "Product Manager",
  "Other",
];

// Same-origin relative paths only (blocks //evil.com and /\evil.com).
function safePath(path: string | null): string | null {
  return path && /^\/(?![/\\])/.test(path) ? path : null;
}

const field =
  "w-full min-h-11 rounded-[var(--radius-btn)] border border-[var(--border-light)] bg-surface-tint px-4 py-3 text-base text-content placeholder:text-content-hint outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60";
const label = "mb-1 block text-sm font-medium text-content";

// Animates height and opacity. `inert` keeps hidden fields out of tab order and validation.
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      inert={!open}
      aria-hidden={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

export default function AuthForm({ initialMode }: { initialMode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>(
    params.get("mode") === "complete_google_signup" ? "complete_google_signup" : initialMode,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [profession, setProfession] = useState(PROFESSIONS[0]);
  const [customProfession, setCustomProfession] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const isSignup = mode === "signup" || mode === "complete_google_signup";
  const plan = params.get("plan") === "pro" ? "pro" : null;
  const cycle = params.get("cycle") === "month" ? "month" : "year";
  const destination = plan
    ? `/pricing?plan=pro&cycle=${cycle}`
    : safePath(params.get("next")) ?? "/dashboard";

  useEffect(() => {
    if (mode !== "complete_google_signup") return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      setEmail(data.user.email ?? "");
      setName((data.user.user_metadata?.full_name as string) ?? "");
    });
    return () => {
      active = false;
    };
  }, [mode, supabase]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Switch tabs without a page load; keep the address bar and query string in sync.
  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    window.history.replaceState(null, "", `${next === "signup" ? "/signup" : "/login"}${window.location.search}`);
  }

  const finalProfession = profession === "Other" ? customProfession.trim() || "Other" : profession;
  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`;

  async function saveProfile(userId: string) {
    // Best effort. If it fails, the signed-in consent check asks once.
    await supabase.from("profiles").upsert(
      {
        id: userId,
        display_name: name,
        profession: finalProfession,
        workplace: workplace.trim(),
        terms_version: CURRENT_TERMS_VERSION,
        terms_accepted_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  }

  function finish() {
    router.replace(destination);
    router.refresh();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (isSignup) {
      if (password.length < 8) return setError("Use at least 8 characters for your password.");
      if (password !== confirm) return setError("The passwords do not match.");
      if (mode === "signup" && !agreed) return setError("Please accept the Terms and Privacy Policy to continue.");
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          setError(
            /confirm/i.test(err.message)
              ? "Please confirm your email first. Sign up again to get a new code."
              : "Incorrect email or password.",
          );
          return;
        }
        finish();
      } else if (mode === "complete_google_signup") {
        const { data, error: err } = await supabase.auth.updateUser({
          password,
          data: { full_name: name, profession: finalProfession, workplace: workplace.trim() },
        });
        if (err) throw err;
        if (data.user) await saveProfile(data.user.id);
        finish();
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callback(),
            data: {
              full_name: name,
              profession: finalProfession,
              workplace: workplace.trim(),
              terms_version: CURRENT_TERMS_VERSION,
              terms_accepted_at: new Date().toISOString(),
            },
          },
        });
        if (err) throw err;
        if (data.session && data.user) {
          await saveProfile(data.user.id);
          finish();
        } else {
          // Same message whether or not the email already exists.
          setMode("check_email");
          setCooldown(30);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const next = plan ? destination : isSignup ? "/dashboard/settings/profile" : destination;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?signup=${mode === "signup"}&next=${encodeURIComponent(next)}`,
      },
    });
    if (err) {
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    const { data, error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "signup" });
    setVerifying(false);
    if (err || !data.user) return setError("That code is invalid or has expired. Request a new one.");
    await saveProfile(data.user.id);
    finish();
  }

  async function resend() {
    setCooldown(30);
    await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: callback() } });
  }

  const shell = "gradient-bg flex min-h-[100dvh] w-full items-center justify-center p-4 sm:p-6";
  const card =
    "my-auto w-full max-w-md rounded-[var(--radius-shell)] bg-surface p-6 shadow-[var(--shadow-shell-soft)] sm:p-8";

  if (mode === "check_email") {
    return (
      <div className={shell}>
        <div className={`${card} animate-in fade-in text-center duration-300`}>
          <div className="mb-4 flex justify-center"><Brand size="lg" /></div>
          <h1 className="text-2xl font-bold text-content">Check your email</h1>
          <p className="mt-2 text-sm text-content-secondary">
            We sent a 6-digit code to <span className="font-medium text-content">{email}</span>. Enter it to finish creating your account.
          </p>
          <form onSubmit={verifyCode} className="mt-6">
            <input inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required aria-label="6-digit code" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${field} text-center text-xl tracking-[0.5em]`} />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <button disabled={verifying || code.length !== 6} className="mt-4 min-h-11 w-full rounded-full bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {verifying ? "Verifying…" : "Verify and continue"}
            </button>
          </form>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="min-h-11 rounded-full border border-[var(--border-light)] bg-white font-medium text-content transition hover:bg-slate-50 disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("login"); setPassword(""); setConfirm(""); }}
              className="min-h-11 text-sm font-medium text-blue-600 hover:underline"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className={card}>
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center"><Brand size="lg" /></div>
          <div key={mode} className="animate-in fade-in duration-300">
            <h1 className="text-2xl font-bold text-content">
              {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Finish your account"}
            </h1>
            <p className="mt-1.5 text-sm text-content-secondary">
              {mode === "login"
                ? "Sign in to see your projects."
                : mode === "signup"
                  ? "Free for 3 projects. No card needed."
                  : "Set a password so you can also sign in with email."}
            </p>
          </div>
        </div>

        {mode !== "complete_google_signup" && (
          <div role="tablist" aria-label="Account" className="relative mx-auto mb-6 grid max-w-xs grid-cols-2 rounded-full border border-[var(--border-light)] bg-surface-tint p-1">
            <span
              aria-hidden
              className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-xs transition-transform duration-300 ease-out motion-reduce:transition-none ${
                mode === "signup" ? "translate-x-full" : ""
              }`}
            />
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`relative z-10 min-h-11 rounded-full text-sm font-semibold transition-colors ${
                  mode === m ? "text-content" : "text-content-secondary hover:text-content"
                }`}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate={false}>
          <Collapse open={isSignup}>
            <div className="pb-4">
              <label htmlFor="name" className={label}>Full name</label>
              <input id="name" type="text" autoComplete="name" required={isSignup} value={name}
                onChange={(e) => setName(e.target.value)} className={field} placeholder="Alex Rivera" />
            </div>
          </Collapse>

          <div className="pb-4">
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none"
              spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={mode === "complete_google_signup"} className={field} />
          </div>

          <div className="pb-4">
            <label htmlFor="password" className={label}>Password</label>
            <input id="password" type="password" required minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? "new-password" : "current-password"} value={password}
              onChange={(e) => setPassword(e.target.value)} className={field} />
            <Collapse open={mode === "login"}>
              <div className="pt-2 text-right">
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
              </div>
            </Collapse>
          </div>

          <Collapse open={isSignup}>
            <div className="space-y-4 pb-4">
              <div>
                <label htmlFor="confirm" className={label}>Confirm password</label>
                <input id="confirm" type="password" required={isSignup} autoComplete="new-password"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
              </div>
              <div>
                <label htmlFor="profession" className={label}>What do you do? <span className="text-content-hint">(optional)</span></label>
                <select id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} className={field}>
                  {PROFESSIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
                {profession === "Other" && (
                  <input type="text" aria-label="Your profession" value={customProfession}
                    onChange={(e) => setCustomProfession(e.target.value)} className={`${field} mt-2`} placeholder="Your profession" />
                )}
              </div>
              <div>
                <label htmlFor="workplace" className={label}>Workplace or college <span className="text-content-hint">(optional)</span></label>
                <input id="workplace" type="text" autoComplete="organization" value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)} className={field} />
              </div>
            </div>
          </Collapse>

          <Collapse open={mode === "signup"}>
            <div className="flex items-start gap-3 pb-4">
              <input id="terms" type="checkbox" required={mode === "signup"} checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-blue-600" />
              <label htmlFor="terms" className="text-sm text-content">
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Terms</a> and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </label>
            </div>
          </Collapse>

          <p role="alert" aria-live="polite"
            className={`rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ${error ? "mb-4" : "hidden"}`}>
            {error}
          </p>

          <button type="submit" disabled={loading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Complete account"}
          </button>
        </form>

        {mode !== "complete_google_signup" && (
          <>
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-content-hint">or</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <button type="button" onClick={handleGoogle} disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[var(--border-light)] bg-white font-medium text-content transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <p className="mt-5 text-center text-xs text-content-hint">
          By continuing, you agree to our{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-content">Terms</a> and{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-content">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
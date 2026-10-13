"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Brand from "@/components/ui/Brand";
import LoadingOrb from "@/components/ui/LoadingOrb";
import AvatarPicker, { DEFAULT_AVATARS } from "@/components/ui/AvatarPicker";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";

const DEFAULT_PROFESSIONS = [
  "Software Developer",
  "Student",
  "Indie Hacker / Founder",
  "UI/UX Designer",
  "Freelancer",
  "Product Manager",
  "Other",
];

function LoginContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "complete_google_signup" ? "complete_google_signup" : "login";
  const [mode, setMode] = useState<"login" | "signup" | "complete_google_signup">(initialMode);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(DEFAULT_AVATARS[0]);
  const [profession, setProfession] = useState<string>("Software Developer");
  const [customProfession, setCustomProfession] = useState<string>("");
  const [workplace, setWorkplace] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (mode === "complete_google_signup") {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          setEmail(data.user.email);
        }
        if (data?.user?.user_metadata?.full_name) {
          setName(data.user.user_metadata.full_name);
        }
        if (data?.user?.user_metadata?.avatar_url) {
          setAvatarUrl(data.user.user_metadata.avatar_url);
        }
      });
    }
  }, [mode, supabase]);


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    
    if ((mode === "signup" || mode === "complete_google_signup") && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if ((mode === "signup" || mode === "complete_google_signup") && !agreedToTerms) {
      setError("You must agree to the Terms and Privacy Policy");
      return;
    }
// Dev Mode Bypass
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("mock-project")) {
      alert(`[Dev Mode] Simulating ${mode} success since you are using mock keys. Going to dashboard!`);
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      } else if (mode === "complete_google_signup") {
        const finalProfession = profession === "Other" ? (customProfession.trim() || "Other") : (profession || "Software Developer");
        const { data: updateData, error } = await supabase.auth.updateUser({ 
          password,
          data: { 
            full_name: name,
            avatar_url: avatarUrl,
            profession: finalProfession,
            workplace: workplace.trim(),
          }
        });
        if (error) throw error;
        if (updateData?.user) {
          await supabase.from('profiles').upsert({
            id: updateData.user.id,
            display_name: name,
            avatar_url: avatarUrl,
            profession: finalProfession,
            workplace: workplace.trim(),
            terms_version: CURRENT_TERMS_VERSION,
            terms_accepted_at: new Date().toISOString()
          }, { onConflict: 'id' });
        }
        router.push("/dashboard");
      } else {
        const finalProfession = profession === "Other" ? (customProfession.trim() || "Other") : (profession || "Software Developer");
        const { data: signUpData, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name,
              avatar_url: avatarUrl,
              profession: finalProfession,
              workplace: workplace.trim(),
            }
          }
        });
        if (error) throw error;

        if (signUpData?.user) {
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            display_name: name,
            avatar_url: avatarUrl,
            profession: finalProfession,
            workplace: workplace.trim(),
            terms_version: CURRENT_TERMS_VERSION,
            terms_accepted_at: new Date().toISOString()
          }, { onConflict: 'id' });
        }

        alert("Account created! (If email confirmation is enabled, please check your email).");
        if (!error) {
           router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleGoogleAuth = async () => {
    if ((mode === "signup" || mode === "complete_google_signup") && !agreedToTerms) {
      setError("You must agree to the Terms and Privacy Policy");
      return;
    }

    // Dev Mode Bypass
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("mock-project")) {
      alert("[Dev Mode] Simulating Google Auth success. Going to dashboard!");
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 md:p-8 gradient-bg">
      <div className={`w-full ${mode === "signup" || mode === "complete_google_signup" ? "max-w-xl" : "max-w-md"} bg-surface p-6 sm:p-8 rounded-[var(--radius-shell)] shadow-[var(--shadow-shell-soft)] transition-all my-auto`}>
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            <Brand size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-content">Welcome to TheCore</h1>
          <p className="text-content-secondary mt-1.5 text-sm">
            {mode === "login" ? "Sign in to your account" : mode === "complete_google_signup" ? "Set a password to complete your account" : "Create a new account"}
          </p>
        </div>

        {mode !== "complete_google_signup" && (
          <div className="flex bg-surface-tint p-1 rounded-lg mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "login" ? "bg-surface shadow-sm text-content" : "text-content-secondary hover:text-content"}`}
              onClick={() => { setMode("login"); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "signup" ? "bg-surface shadow-sm text-content" : "text-content-secondary hover:text-content"}`}
              onClick={() => { setMode("signup"); setError(null); }}
            >
              Sign Up
            </button>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleAuth}>
          {(mode === "signup" || mode === "complete_google_signup") && (
            <>
              {/* Profile Photo / 3D Pixar Avatar Picker */}
              <div className="pb-1">
                <AvatarPicker
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  nameFallback={name || "User"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-tint border-none rounded-[var(--radius-btn)] text-content placeholder:text-content-hint outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700"
                  placeholder="e.g. Alex Rivera"
                />
              </div>

              {/* Profession Selection */}
              <div>
                <label className="block text-sm font-medium text-content mb-1.5">
                  Profession / Role
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DEFAULT_PROFESSIONS.map((prof) => (
                    <button
                      key={prof}
                      type="button"
                      onClick={() => setProfession(prof)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        profession === prof
                          ? "bg-accent-primary text-white shadow-xs"
                          : "bg-surface-tint hover:bg-surface text-content border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {prof}
                    </button>
                  ))}
                </div>
                {profession === "Other" && (
                  <input
                    type="text"
                    required
                    value={customProfession}
                    onChange={(e) => setCustomProfession(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-tint border-none rounded-[var(--radius-btn)] text-content placeholder:text-content-hint outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700 text-sm mt-1"
                    placeholder="Enter your profession..."
                  />
                )}
              </div>

              {/* Workplace / College */}
              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  Workplace / College / Organization
                </label>
                <input
                  type="text"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-tint border-none rounded-[var(--radius-btn)] text-content placeholder:text-content-hint outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700"
                  placeholder="e.g. Google, MIT, Freelancer, Stealth Startup..."
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-content mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mode === "complete_google_signup"}
              className="w-full px-4 py-3 bg-surface-tint border-none rounded-[var(--radius-btn)] text-content placeholder:text-content-hint outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface-tint border-none rounded-[var(--radius-btn)] text-content placeholder:text-content-hint outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700"
              placeholder=""
            />
          </div>
          {(mode === "signup" || mode === "complete_google_signup") && (
            <div>
              <label className="block text-sm font-medium text-content mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface-tint border-none rounded-[var(--radius-btn)] text-content placeholder:text-content-hint outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700"
                placeholder=""
              />
            </div>
          )}
          {(mode === "signup" || mode === "complete_google_signup") && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-content">
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Privacy Policy</a>
              </label>
            </div>
          )}

          {error && <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-950/20 rounded-[var(--radius-btn)]">{error}</div>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent-primary text-white rounded-[var(--radius-btn)] font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700 focus-visible:ring-offset-2"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "complete_google_signup" ? "Complete Account" : "Create Account"}
            </button>
          </div>
        </form>

        {mode !== "complete_google_signup" && (
          <>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="h-px bg-surface-tint flex-1" />
              <span className="text-content-hint text-xs font-medium uppercase tracking-wider">or</span>
              <div className="h-px bg-surface-tint flex-1" />
            </div>
            
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-3 py-3 bg-surface border border-surface-tint text-content rounded-[var(--radius-btn)] font-medium hover:bg-surface-tint transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700 focus-visible:ring-offset-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}
        <p className="text-center text-xs text-content-hint mt-4">
          By continuing, you agree to our <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-content">Terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-content">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center w-full bg-page">
          <LoadingOrb state="listening" size={64} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

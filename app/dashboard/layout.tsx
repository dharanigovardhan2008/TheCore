import React from "react";
import type { Metadata } from "next";
import Shell from "@/components/layout/Shell";
import { VaultProvider } from "@/components/providers/VaultProvider";
import { createClient } from "@/utils/supabase/server";
import TermsConsentModal from "@/components/legal/TermsConsentModal";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";
import { isProActive } from "@/lib/plans";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let showConsent = false;
  let plan = 'free';
  let isPro = false;
  let planExpiresAt: string | null = null;

  let avatarUrl: string | null = null;
  let profession: string | null = null;
  let workplace: string | null = null;
  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('terms_version, plan, plan_expires_at, avatar_url, profession, workplace, display_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.terms_version !== CURRENT_TERMS_VERSION) {
      showConsent = true;
    }

    isPro = isProActive(profile?.plan, profile?.plan_expires_at);
    plan = isPro ? 'pro' : (profile?.plan || 'free');
    planExpiresAt = profile?.plan_expires_at || null;
    avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;
    profession = profile?.profession || user.user_metadata?.profession || null;
    workplace = profile?.workplace || user.user_metadata?.workplace || null;
    displayName = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || null;
  }

  const userObj = user ? { 
    email: user.email || '', 
    name: displayName || user.email?.split('@')[0] || 'User',
    avatarUrl,
    profession,
    workplace,
    plan,
    isPro,
    planExpiresAt
  } : { email: '', name: 'User', avatarUrl: null, profession: null, workplace: null, plan: 'free', isPro: false, planExpiresAt: null };

  return (
    <VaultProvider>
      {showConsent && <TermsConsentModal showConsent={true} />}
      <Shell user={userObj}>
        {children}
      </Shell>
    </VaultProvider>
  );
}

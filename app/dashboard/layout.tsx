import React from "react";
import type { Metadata } from "next";
import Shell from "@/components/layout/Shell";
import { VaultProvider } from "@/components/providers/VaultProvider";
import { createClient } from "@/utils/supabase/server";
import TermsConsentModal from "@/components/legal/TermsConsentModal";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let termsVersion = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('terms_version').eq('id', user.id).single();
    if (profile) {
      termsVersion = profile.terms_version;
    }
  }

  const userObj = user ? { 
    email: user.email || '', 
    name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  } : { email: '', name: 'User' };

  return (
    <VaultProvider>
      <TermsConsentModal currentVersion={termsVersion} />
      <Shell user={userObj}>
        {children}
      </Shell>
    </VaultProvider>
  );
}

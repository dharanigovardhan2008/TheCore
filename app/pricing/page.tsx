import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { getUserPlanAndUsage } from '@/app/dashboard/actions';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Pricing & Plans | TheCore',
  description: 'Simple, transparent pricing. Free for getting started, Pro for unlimited projects and encrypted .env vaults.',
};

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userPlan: Awaited<ReturnType<typeof getUserPlanAndUsage>> | null = null;
  if (user) {
    try {
      userPlan = await getUserPlanAndUsage();
    } catch {
      // Ignored for non-dashboard visits
    }
  }

  return (
    <PricingClient
      isLoggedIn={Boolean(user)}
      currentPlan={userPlan?.plan || 'free'}
      isPro={Boolean(userPlan?.isPro)}
      planExpiresAt={userPlan?.plan_expires_at || null}
    />
  );
}


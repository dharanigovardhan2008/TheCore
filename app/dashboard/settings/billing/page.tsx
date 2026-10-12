import { Metadata } from 'next';
import { getUserPlanAndUsage } from '@/app/dashboard/actions';
import { redirect } from 'next/navigation';
import BillingClient from './BillingClient';

export const metadata: Metadata = {
  title: 'Billing & Plans | TheCore',
  description: 'Manage your TheCore Pro subscription, usage limits, and payment history.',
};

export default async function BillingSettingsPage() {
  const usage = await getUserPlanAndUsage();

  if (!usage) {
    redirect('/login?next=/dashboard/settings/billing');
  }

  return <BillingClient usage={usage} />;
}


import { Metadata } from 'next';
import BillingReturnClient from './BillingReturnClient';

export const metadata: Metadata = {
  title: 'Payment Confirmation | TheCore',
  description: 'Verifying your payment.',
};

export const dynamic = 'force-dynamic';

interface ReturnPageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function BillingReturnPage({ searchParams }: ReturnPageProps) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.order_id || null;

  return <BillingReturnClient orderId={orderId} />;
}


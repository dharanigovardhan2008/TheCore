import { Metadata } from 'next';
import BillingReturnClient from './BillingReturnClient';

export const metadata: Metadata = {
  title: 'Payment Confirmation | TheCore',
  description: 'Verifying subscription payment with Cashfree Payments.',
};

interface ReturnPageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function BillingReturnPage({ searchParams }: ReturnPageProps) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.order_id || null;

  return <BillingReturnClient orderId={orderId} />;
}


'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { verifyOrderReturn } from '@/app/dashboard/actions';
import PaymentStatusModal, { type PaymentModalStatus } from '@/components/ui/PaymentStatusModal';

import type { Order } from '@/lib/types';
import { formatMinor } from '@/lib/currency';

interface BillingReturnClientProps {
  orderId: string | null;
}

export default function BillingReturnClient({ orderId }: BillingReturnClientProps) {
  const [status, setStatus] = useState<PaymentModalStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);

  const checkStatus = useCallback(async () => {
    if (!orderId) {
      setStatus('failed');
      setErrorMessage('Missing order ID in return URL.');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage(null);
      const res = await verifyOrderReturn(orderId);

      if (res.orderStatus === 'paid') {
        setStatus('success');
        if (res.order) setOrderDetails(res.order);
      } else if (res.orderStatus === 'pending') {
        setStatus('pending');
        if (res.order) setOrderDetails(res.order);
        if (res.errorMessage) {
          setErrorMessage(res.errorMessage);
        }
      } else {
        setStatus('failed');
        if (res.order) setOrderDetails(res.order);
        setErrorMessage(res.errorMessage || `Payment status: ${res.orderStatus}.`);
      }
    } catch (err: unknown) {
      console.error('Error verifying payment return:', err);
      setStatus('failed');
      const raw = (err as Error)?.message || '';
      if (raw.includes('Minified React error') || raw.includes('react.dev/errors')) {
        setErrorMessage('Verification is processing. If your payment completed, your Pro plan will be active shortly.');
      } else {
        setErrorMessage(raw || "We couldn't complete your payment. Please try again or choose another payment method.");
      }
    }
  }, [orderId]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!ignore) {
        await checkStatus();
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [checkStatus]);

  // International payments are confirmed by a webhook that can arrive a few seconds after the
  // redirect, so re-check about every 3 seconds (max 20 times) while the status is pending.
  const pollCount = useRef(0);
  useEffect(() => {
    if (status !== 'pending' || pollCount.current >= 20) return;
    const timer = setTimeout(() => {
      pollCount.current += 1;
      void checkStatus();
    }, 3000);
    return () => clearTimeout(timer);
  }, [status, checkStatus]);

  // Route directly to the pixel-perfect Apple-inspired 3D modal layout
  return (
    <PaymentStatusModal
      isOpen={true}
      isStandalonePage={true}
      status={status}
      heading={
        status === 'success'
          ? 'Transaction Successful'
          : status === 'failed'
          ? 'Payment Failed'
          : status === 'pending'
          ? 'Payment Processing'
          : 'Confirming payment...'
      }
      description={
        status === 'success'
          ? 'Your transaction completed successfully and you can continue your work without any delay now.'
          : status === 'failed'
          ? "We couldn't complete your payment. Please try again or choose another payment method."
          : status === 'pending'
          ? errorMessage || 'Cashfree is awaiting bank confirmation. Your account will automatically activate once confirmed.'
          : 'Verifying payment authorization with Cashfree Payments. Please do not close this window.'
      }
      primaryButtonText={
        status === 'success'
          ? 'Got it'
          : status === 'failed'
          ? 'Try Again'
          : status === 'pending'
          ? 'Re-check Status'
          : 'Please wait'
      }
      primaryButtonHref={
        status === 'success'
          ? '/dashboard'
          : status === 'failed'
          ? '/pricing'
          : undefined
      }
      onPrimaryClick={status === 'pending' ? checkStatus : undefined}
      secondaryButtonText={status === 'failed' || status === 'pending' ? 'Cancel' : undefined}
      secondaryButtonHref={status === 'failed' || status === 'pending' ? '/dashboard' : undefined}
      ticketData={{
        orderId: orderDetails?.cf_order_id || orderId || undefined,
        amountText: orderDetails?.amount_paise ? formatMinor(orderDetails.amount_paise, orderDetails.currency) : undefined,
        provider: orderDetails?.provider,
        planName: orderDetails?.billing_cycle === 'year' ? 'TheCore Pro Annual' : 'TheCore Pro Monthly',
        dateStr: orderDetails?.paid_at
          ? new Date(orderDetails.paid_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }) + ` • ${new Date(orderDetails.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : undefined,
      }}
    />
  );
}

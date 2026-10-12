'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Clock, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { verifyOrderReturn } from '@/app/dashboard/actions';
import type { Order } from '@/lib/types';

interface BillingReturnClientProps {
  orderId: string | null;
}

export default function BillingReturnClient({ orderId }: BillingReturnClientProps) {
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'failed'>('loading');
  const [details, setDetails] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        setStatus('paid');
        setDetails(res.order || null);
      } else if (res.orderStatus === 'pending') {
        setStatus('pending');
        setDetails(res.order || null);
        if (res.errorMessage) {
          setErrorMessage(res.errorMessage);
        }
      } else {
        setStatus('failed');
        setDetails(res.order || null);
        setErrorMessage(res.errorMessage || `Payment status: ${res.orderStatus}.`);
      }
    } catch (err: unknown) {
      console.error('Error verifying payment return:', err);
      setStatus('failed');
      const raw = (err as Error)?.message || '';
      if (raw.includes('Minified React error') || raw.includes('react.dev/errors')) {
        setErrorMessage('Verification is still processing. If your payment went through, your Pro plan will be active. Please check your billing settings below.');
      } else {
        setErrorMessage(raw || 'Failed to verify payment status with Cashfree.');
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

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-content)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--bg-surface)] p-8 rounded-2xl border border-[var(--separator)] shadow-lg text-center">
        {status === 'loading' && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <h2 className="text-xl font-bold">Confirming payment...</h2>
            <p className="text-sm text-[var(--text-content-secondary)]">
              Verifying payment authorization with Cashfree Payments. Please do not close this window.
            </p>
          </div>
        )}

        {status === 'paid' && (
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--text-content)]">Payment Successful!</h2>
              <p className="text-sm text-[var(--text-content-secondary)] mt-1">
                Your account has been upgraded to <strong>TheCore Pro</strong>. All limits have been unlocked.
              </p>
            </div>

            {details && (
              <div className="p-4 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-content-secondary)]">Order ID</span>
                  <span className="font-mono">{details.cf_order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-content-secondary)]">Amount Paid</span>
                  <span className="font-semibold">₹{(details.amount_paise / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-content-secondary)]">Billing Period</span>
                  <span className="capitalize">{details.billing_cycle === 'year' ? '12 Months' : '1 Month'}</span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Link
                href="/dashboard"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/settings/billing"
                className="block text-xs text-[var(--text-content-secondary)] hover:text-[var(--text-content)] transition-colors"
              >
                View billing & receipts
              </Link>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Payment Processing</h2>
              <p className="text-sm text-[var(--text-content-secondary)] mt-1">
                {errorMessage || 'Cashfree is awaiting bank confirmation. Your account will automatically activate once confirmed.'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={checkStatus}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-grouped)] hover:bg-[var(--separator)] text-sm font-medium border border-[var(--separator)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Re-check Status
              </button>
              <Link
                href="/dashboard/settings/billing"
                className="block text-xs text-[var(--text-content-secondary)] hover:text-[var(--text-content)] transition-colors"
              >
                Check Billing Settings
              </Link>
              <Link
                href="/dashboard"
                className="block text-xs text-[var(--text-content-secondary)] hover:text-[var(--text-content)] transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Payment Incomplete</h2>
              <p className="text-sm text-[var(--text-content-secondary)] mt-1">
                {errorMessage || 'The payment could not be completed or was canceled.'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={checkStatus}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-grouped)] hover:bg-[var(--separator)] text-sm font-medium border border-[var(--separator)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Re-check Status
              </button>
              <Link
                href="/pricing"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm block text-center"
              >
                Try Again at Pricing
              </Link>
              <Link
                href="/dashboard/settings/billing"
                className="block text-xs text-[var(--text-content-secondary)] hover:text-[var(--text-content)] transition-colors"
              >
                Check Billing Page
              </Link>
              <Link
                href="/dashboard"
                className="block text-xs text-[var(--text-content-secondary)] hover:text-[var(--text-content)] transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


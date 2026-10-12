'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Zap, Shield, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { PLANS, BillingCycle } from '@/lib/plans';
import { createCheckoutSession } from '@/app/dashboard/actions';

interface CashfreeSDKInstance {
  checkout: (opts: { 
    paymentSessionId: string; 
    redirectTarget?: string;
    returnUrl?: string;
  }) => Promise<{ error?: { message: string; code?: string; type?: string }; redirect?: boolean }>;
}

type CashfreeInit = (opts: { mode: 'production' | 'sandbox' }) => CashfreeSDKInstance;

interface CashfreeWindow extends Window {
  Cashfree?: CashfreeInit;
}

interface PricingClientProps {
  isLoggedIn: boolean;
  currentPlan?: 'free' | 'pro';
  isPro: boolean;
  planExpiresAt: string | null;
}

export default function PricingClient({
  isLoggedIn,
  isPro,
  planExpiresAt,
}: PricingClientProps) {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>('year');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const freePlan = PLANS.free;
  const proPlan = PLANS.pro;
  const pricing = proPlan.pricing![cycle];

  const handleUpgrade = async () => {
    if (!isLoggedIn) {
      router.push('/login?next=/pricing');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const session = await createCheckoutSession(cycle);

      // Dynamically load Cashfree Web SDK
      const loadCashfreeSdk = async (): Promise<CashfreeSDKInstance> => {
        const win = window as unknown as CashfreeWindow;
        if (win.Cashfree) {
          return win.Cashfree({ mode: session.environment === 'production' ? 'production' : 'sandbox' });
        }
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
          script.onload = () => {
            const loadedWin = window as unknown as CashfreeWindow;
            if (loadedWin.Cashfree) {
              resolve(loadedWin.Cashfree({ mode: session.environment === 'production' ? 'production' : 'sandbox' }));
            } else {
              reject(new Error('Cashfree SDK failed to initialize'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load Cashfree checkout script'));
          document.head.appendChild(script);
        });
      };

      try {
        const cashfree = await loadCashfreeSdk();
        const checkoutResult = await cashfree.checkout({
          paymentSessionId: session.paymentSessionId,
          redirectTarget: '_self',
          returnUrl: session.returnUrl,
        });

        if (checkoutResult?.error) {
          console.warn('[Cashfree Checkout SDK Error]:', checkoutResult.error);
          setErrorMsg(checkoutResult.error.message || 'Payment initialization cancelled or failed.');
          setLoading(false);
          return;
        }
      } catch (sdkErr: unknown) {
        console.warn('Direct Cashfree SDK checkout warning:', (sdkErr as Error)?.message);
        // Fallback directly to return URL for verification
        router.push(`/billing/return?order_id=${session.orderId}`);
      }
    } catch (err: unknown) {
      console.error('Upgrade error:', err);
      setErrorMsg((err as Error)?.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-content)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-content-secondary)] hover:text-[var(--text-content)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, Transparent Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Build and track without limits
          </h1>
          <p className="text-[var(--text-content-secondary)] text-sm sm:text-base">
            Start free with up to 3 projects. Upgrade to Pro when you need unlimited apps, environments, and priority support.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
            <button
              type="button"
              onClick={() => setCycle('month')}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer ${
                cycle === 'month'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-content)] shadow-sm'
                  : 'text-[var(--text-content-secondary)] hover:text-[var(--text-content)]'
              }`}
            >
              Monthly billing
            </button>
            <button
              type="button"
              onClick={() => setCycle('year')}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                cycle === 'year'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-content)] shadow-sm'
                  : 'text-[var(--text-content-secondary)] hover:text-[var(--text-content)]'
              }`}
            >
              <span>Annual billing</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Save 16%
              </span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Free Card */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--separator)] p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{freePlan.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-grouped)] text-[var(--text-content-secondary)] border border-[var(--separator)]">
                  {freePlan.badge}
                </span>
              </div>
              <p className="text-sm text-[var(--text-content-secondary)] mb-6 min-h-[40px]">
                {freePlan.description}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold">₹0</span>
                <span className="text-sm text-[var(--text-content-secondary)] ml-2">free forever</span>
              </div>

              <div className="border-t border-[var(--separator)] pt-6 space-y-3 mb-8">
                {freePlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-[var(--text-content-secondary)]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {isLoggedIn && !isPro ? (
                <div className="w-full py-2.5 text-center text-sm font-medium rounded-xl bg-[var(--bg-grouped)] text-[var(--text-content-secondary)] border border-[var(--separator)]">
                  Current Plan
                </div>
              ) : (
                <Link
                  href={isLoggedIn ? '/dashboard' : '/signup'}
                  className="block w-full py-2.5 text-center text-sm font-medium rounded-xl bg-[var(--bg-grouped)] hover:bg-[var(--separator)] text-[var(--text-content)] border border-[var(--separator)] transition-colors"
                >
                  {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
                </Link>
              )}
            </div>
          </div>

          {/* Pro Card */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border-2 border-blue-500/50 p-8 shadow-md relative flex flex-col justify-between">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-sm">
              Recommended
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {proPlan.name}
                  <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {proPlan.badge}
                </span>
              </div>
              <p className="text-sm text-[var(--text-content-secondary)] mb-6 min-h-[40px]">
                {proPlan.description}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold">₹{pricing.amountInRupees}</span>
                <span className="text-sm text-[var(--text-content-secondary)] ml-2">{pricing.periodLabel}</span>
              </div>

              <div className="border-t border-[var(--separator)] pt-6 space-y-3 mb-8">
                {proPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-[var(--text-content)]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {isPro ? (
                <div className="space-y-2">
                  <div className="w-full py-2.5 text-center text-sm font-medium rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Pro Active {planExpiresAt && `(until ${new Date(planExpiresAt).toLocaleDateString()})`}
                  </div>
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-2 text-center text-xs font-medium rounded-xl bg-[var(--bg-grouped)] hover:bg-[var(--separator)] text-[var(--text-content)] transition-colors cursor-pointer"
                  >
                    {loading ? 'Opening checkout...' : `Extend Pro for ₹${pricing.amountInRupees}`}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-3 px-4 text-center text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Opening Cashfree Checkout...
                    </>
                  ) : (
                    `Upgrade to Pro — ₹${pricing.amountInRupees}`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Compliance Footnote */}
        <div className="text-center space-y-3 max-w-xl mx-auto pt-4 border-t border-[var(--separator)]">
          <p className="text-xs text-[var(--text-content-tertiary)] flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Prices in INR, taxes as applicable. Secured by Cashfree Payments with 256-bit encryption.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-content-secondary)]">
            <Link href="/refund-policy" className="hover:underline">Refund Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <span>•</span>
            <Link href="/contact" className="hover:underline">Contact Us</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}


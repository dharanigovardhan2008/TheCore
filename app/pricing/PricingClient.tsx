'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Zap, Shield, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { PLANS, BillingCycle } from '@/lib/plans';
import { createCheckoutSession } from '@/app/dashboard/actions';
import PaymentStatusModal from '@/components/ui/PaymentStatusModal';

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
  const [paymentModalState, setPaymentModalState] = useState<'success' | 'failed' | null>(null);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);

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
      setPaymentModalError(null);

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
          const msg = checkoutResult.error.message || "We couldn't complete your payment. Please try again or choose another payment method.";
          setErrorMsg(msg);
          setPaymentModalError(msg);
          setPaymentModalState('failed');
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
      const msg = (err as Error)?.message || "We couldn't complete your payment. Please try again or choose another payment method.";
      setErrorMsg(msg);
      setPaymentModalError(msg);
      setPaymentModalState('failed');
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
              className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 group"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
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

        {/* Heading & Subtitle exactly matching reference */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-white mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg font-normal">
            No contracts. No surprise fees.
          </p>

          {/* Billing Cycle Pill Switcher */}
          <div className="mt-8 inline-flex items-center p-1 rounded-full bg-white dark:bg-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCycle('month')}
              className={`px-6 py-2 text-xs font-bold tracking-wider uppercase rounded-full transition-all cursor-pointer ${
                cycle === 'month'
                  ? 'bg-[#4C6FFF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              MONTHLY
            </button>
            <button
              type="button"
              onClick={() => setCycle('year')}
              className={`px-6 py-2 text-xs font-bold tracking-wider uppercase rounded-full transition-all cursor-pointer ${
                cycle === 'year'
                  ? 'bg-[#4C6FFF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              YEARLY
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* 3-Card Unified Container Matching Exact Screenshot */}
        <div className="relative max-w-5xl mx-auto mb-16">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[36px] shadow-[0_20px_50px_rgba(70,80,160,0.06)] dark:shadow-none border border-slate-100/90 dark:border-slate-800/80 grid grid-cols-1 lg:grid-cols-3 items-stretch relative">
            
            {/* Card 1: Base */}
            <div className="p-8 sm:p-10 flex flex-col justify-between rounded-t-[32px] lg:rounded-tr-none lg:rounded-l-[32px]">
              <div>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹0</span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1.5">/month</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Base</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] leading-relaxed mb-6">
                  For solo developers getting started with personal projects and databases.
                </p>

                <div className="space-y-3.5 mb-8">
                  {[
                    'Up to 3 active projects',
                    '1 encrypted .env file per project',
                    'Client-side AES-256 vault',
                    'To-do tasks & platform tracker',
                    'Full JSON data export & import',
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="font-medium text-xs sm:text-sm">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {isLoggedIn && !isPro ? (
                  <div className="w-full py-3.5 px-6 rounded-full bg-[#F0F3FA] dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider text-center">
                    Current Plan
                  </div>
                ) : (
                  <Link
                    href={isLoggedIn ? '/dashboard' : '/signup'}
                    className="block w-full py-3.5 px-6 rounded-full bg-[#F0F3FA] dark:bg-slate-800 hover:bg-[#E4E8F2] dark:hover:bg-slate-700 text-[#475569] dark:text-slate-200 font-bold text-xs uppercase tracking-wider text-center transition-colors"
                  >
                    {isLoggedIn ? 'Go to Dashboard' : 'Downgrade'}
                  </Link>
                )}
              </div>
            </div>

            {/* Card 2: Pro (Center Elevated Hero Card) */}
            <div className="relative z-10 lg:-my-8 lg:-mx-2 rounded-[28px] sm:rounded-[32px] bg-[#4C6FFF] text-white p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(76,111,255,0.5)] flex flex-col justify-between">
              {/* Most Popular Badge */}
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/20 text-white backdrop-blur-sm">
                MOST POPULAR
              </div>

              <div>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    ₹{cycle === 'year' ? '999' : '99'}
                  </span>
                  <span className="text-sm font-medium text-white/80 ml-1.5">
                    {cycle === 'year' ? '/year' : '/month'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <p className="text-xs text-white/80 min-h-[36px] leading-relaxed mb-6">
                  For indie hackers & builders who want unlimited projects and encrypted vaults.
                </p>

                <div className="space-y-3.5 mb-8">
                  {[
                    'Unlimited active projects',
                    'Unlimited encrypted .env files',
                    'Multi-environment configurations',
                    'Priority platform & database sync',
                    'Direct developer support',
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-white">
                      <div className="w-5 h-5 rounded-full bg-white/25 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="font-medium text-xs sm:text-sm">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {isPro ? (
                  <div className="space-y-2">
                    <div className="w-full py-2.5 px-4 rounded-full bg-white/20 text-white text-xs font-semibold text-center backdrop-blur-xs">
                      Pro Active {planExpiresAt && `(until ${new Date(planExpiresAt).toLocaleDateString()})`}
                    </div>
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-white/95 text-[#4C6FFF] font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all text-center block cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Connecting...' : `Extend Pro for ₹${cycle === 'year' ? '999' : '99'}`}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-3.5 sm:py-4 px-6 rounded-full bg-white hover:bg-white/95 text-[#4C6FFF] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all text-center block cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#4C6FFF]" />
                        <span>Opening Cashfree...</span>
                      </span>
                    ) : (
                      'Upgrade'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Card 3: Enterprise */}
            <div className="p-8 sm:p-10 flex flex-col justify-between rounded-b-[32px] lg:rounded-bl-none lg:rounded-r-[32px]">
              <div>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">Custom</span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1.5">/team</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Enterprise</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] leading-relaxed mb-6">
                  For teams and organizations requiring shared vaults, SSO & dedicated support.
                </p>

                <div className="space-y-3.5 mb-8">
                  {[
                    'Everything in Pro included',
                    'Team workspaces & collaborative vaults',
                    'Custom platform & cloud integrations',
                    'Dedicated encryption key escrow',
                    'Priority 24/7 developer SLA',
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="font-medium text-xs sm:text-sm">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <a
                  href="mailto:billing@thecore.indevs.in?subject=TheCore Enterprise Plan Inquiry"
                  className="block w-full py-3.5 px-6 rounded-full bg-[#F0F3FA] dark:bg-slate-800 hover:bg-[#E4E8F2] dark:hover:bg-slate-700 text-[#475569] dark:text-slate-200 font-bold text-xs uppercase tracking-wider text-center transition-colors"
                >
                  Upgrade
                </a>
              </div>
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

      {paymentModalState && (
        <PaymentStatusModal
          isOpen={true}
          status={paymentModalState}
          description={paymentModalError || undefined}
          onPrimaryClick={() => {
            setPaymentModalState(null);
            handleUpgrade();
          }}
          onSecondaryClick={() => setPaymentModalState(null)}
          onClose={() => setPaymentModalState(null)}
        />
      )}
    </div>
  );
}


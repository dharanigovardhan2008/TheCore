'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { PLANS, BillingCycle } from '@/lib/plans';
import { createCheckoutSession } from '@/app/dashboard/actions';
import PaymentStatusModal from '@/components/ui/PaymentStatusModal';
import PricingCard from '@/components/ui/PricingCard';

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
  planConfigs?: any[];
}

export default function PricingClient({
  isLoggedIn,
  isPro,
  planExpiresAt,
  planConfigs,
}: PricingClientProps) {
  const router = useRouter();
  const [loadingCycle, setLoadingCycle] = useState<BillingCycle | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentModalState, setPaymentModalState] = useState<'success' | 'failed' | null>(null);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);

  const freePlan = PLANS.free;
  const proPlan = PLANS.pro;

  const proConfig = planConfigs?.find((p) => p.id === 'pro');
  const proMonthPrice = proConfig?.price_month_rupees ?? proPlan.pricing!.month.amountInRupees;
  const proYearPrice = proConfig?.price_year_rupees ?? proPlan.pricing!.year.amountInRupees;
  const proDiscountLabel = proConfig?.discount_label || (proConfig?.discount_percent ? `Save ${proConfig.discount_percent}%` : 'Save 16%');
  const proFeaturesFromConfig = proConfig?.features?.length ? proConfig.features : proPlan.features;

  const handleUpgrade = async (cycle: BillingCycle) => {
    if (!isLoggedIn) {
      router.push('/login?next=/pricing');
      return;
    }

    try {
      setLoadingCycle(cycle);
      setErrorMsg(null);
      setPaymentModalError(null);

      const session = await createCheckoutSession(cycle);

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
          setLoadingCycle(null);
          return;
        }
      } catch (sdkErr: unknown) {
        console.warn('Direct Cashfree SDK checkout warning:', (sdkErr as Error)?.message);
        router.push(`/billing/return?order_id=${session.orderId}`);
      }
    } catch (err: unknown) {
      console.error('Upgrade error:', err);
      const msg = (err as Error)?.message || "We couldn't complete your payment. Please try again or choose another payment method.";
      setErrorMsg(msg);
      setPaymentModalError(msg);
      setPaymentModalState('failed');
    } finally {
      setLoadingCycle(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-content)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-content-secondary)] hover:text-[var(--text-content)] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1.5 group"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#172B2A] mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-[#647570] text-lg">
            Choose the plan that fits your workflow. No hidden fees.
          </p>
        </div>

        {errorMsg && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-[20px] bg-red-50 border border-red-200 text-red-700 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2 duration-300">
            {errorMsg}
          </div>
        )}

        {/* Three-Card Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 max-w-7xl mx-auto items-start">

          {/* Card 1: Free */}
          <PricingCard
            name="Free"
            description="Perfect for students and developers getting started with personal projects"
            price={0}
            period="/forever"
            features={freePlan.features}
            badge={isLoggedIn && !isPro ? "Current Plan" : undefined}
            ctaLabel={isLoggedIn && !isPro ? "Current Plan" : isLoggedIn ? "Go to Dashboard" : "Get Started"}
            ctaAction={() => {
              if (isLoggedIn) {
                router.push('/dashboard');
              } else {
                router.push('/signup');
              }
            }}
            ctaDisabled={isLoggedIn && !isPro}
          />

          {/* Card 2: Pro Annual (Featured) */}
          <PricingCard
            name="Pro"
            description="For freelancers, indie hackers, and professional builders managing multiple apps"
            price={proYearPrice}
            period="/year"
            features={proFeaturesFromConfig}
            badge="Recommended"
            isFeatured
            ctaLabel={isPro ? `Extend for ₹${proYearPrice}` : `Subscribe for ₹${proYearPrice}/year`}
            ctaAction={() => handleUpgrade('year')}
            ctaLoading={loadingCycle === 'year'}
            ctaDisabled={loadingCycle !== null}
            secondaryLabel={`~₹${Math.round(proYearPrice / 12)}/month · ${proDiscountLabel}`}
          />

          {/* Card 3: Pro Monthly */}
          <PricingCard
            name="Pro Monthly"
            description="Flexible monthly subscription with the same unlimited access and priority support"
            price={proMonthPrice}
            period="/month"
            features={proFeaturesFromConfig}
            ctaLabel={isPro ? `Extend for ₹${proMonthPrice}` : `Subscribe for ₹${proMonthPrice}/month`}
            ctaAction={() => handleUpgrade('month')}
            ctaLoading={loadingCycle === 'month'}
            ctaDisabled={loadingCycle !== null}
            secondaryLabel="Billed monthly · Cancel anytime"
          />

        </div>

        {/* Footer */}
        <div className="text-center space-y-3 max-w-xl mx-auto pt-4 border-t border-[#DCE9E3]">
          <p className="text-xs text-[#8E9F9A] flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Prices in INR, taxes as applicable. Secured by Cashfree Payments.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-[#647570]">
            <Link href="/refund-policy" className="hover:text-[#172B2A] hover:underline transition-colors">Refund Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#172B2A] hover:underline transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#172B2A] hover:underline transition-colors">Contact</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#172B2A] hover:underline transition-colors">Privacy</Link>
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
            if (paymentModalState === 'failed') {
              // User can retry by clicking cards again
            }
          }}
          onSecondaryClick={() => setPaymentModalState(null)}
          onClose={() => setPaymentModalState(null)}
        />
      )}

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

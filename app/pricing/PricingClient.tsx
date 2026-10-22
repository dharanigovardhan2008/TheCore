'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { PLANS, BillingCycle } from '@/lib/plans';
import { createCheckoutSession } from '@/app/dashboard/actions';
import PaymentStatusModal from '@/components/ui/PaymentStatusModal';
import PricingCard from '@/components/ui/PricingCard';
import { CurrencySwitch, PhonePrompt } from '@/components/ui/CheckoutControls';
import { launchCheckout } from '@/lib/checkout-client';
import { formatMoney, providerForCurrency, type Currency } from '@/lib/currency';

interface PricingClientProps {
  isLoggedIn: boolean;
  currentPlan?: 'free' | 'pro';
  isPro: boolean;
  planExpiresAt: string | null;
  planConfigs?: any[];
  /** Decided on the server from the request country. */
  initialCurrency?: Currency;
  allowInr?: boolean;
}

export default function PricingClient({
  isLoggedIn,
  isPro,
  planExpiresAt,
  planConfigs,
  initialCurrency = 'INR',
  allowInr = true,
}: PricingClientProps) {
  const router = useRouter();
  const [loadingCycle, setLoadingCycle] = useState<BillingCycle | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentModalState, setPaymentModalState] = useState<'success' | 'failed' | null>(null);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [phonePromptCycle, setPhonePromptCycle] = useState<BillingCycle | null>(null);

  const freePlan = PLANS.free;
  const proPlan = PLANS.pro;

  const proConfig = planConfigs?.find((p) => p.id === 'pro');
  const usd = currency === 'USD';
  const proMonthPrice: number = usd
    ? Number(proConfig?.price_month_usd) || 5
    : proConfig?.price_month_rupees ?? proPlan.pricing!.month.amountInRupees;
  const proYearPrice: number = usd
    ? Number(proConfig?.price_year_usd) || 30
    : proConfig?.price_year_rupees ?? proPlan.pricing!.year.amountInRupees;
  const perMonthOfYear = usd ? (proYearPrice / 12).toFixed(2) : String(Math.round(proYearPrice / 12));
  const proDiscountLabel = proConfig?.discount_label || (proConfig?.discount_percent ? `Save ${proConfig.discount_percent}%` : 'Save 16%');
  const proFeaturesFromConfig = proConfig?.features?.length ? proConfig.features : proPlan.features;

  const handleUpgrade = async (cycle: BillingCycle, phone?: string) => {
    if (!isLoggedIn) {
      router.push('/login?next=/pricing');
      return;
    }

    try {
      setLoadingCycle(cycle);
      setErrorMsg(null);
      setPaymentModalError(null);

      const session = await createCheckoutSession(cycle, { provider: providerForCurrency(currency), phone });
      if (!session.ok) {
        if (session.code === 'PHONE_REQUIRED') {
          setPhonePromptCycle(cycle);
          return;
        }
        setErrorMsg(session.message);
        setPaymentModalError(session.message);
        setPaymentModalState('failed');
        return;
      }

      const launchError = await launchCheckout(session);
      if (launchError) {
        setErrorMsg(launchError);
        setPaymentModalError(launchError);
        setPaymentModalState('failed');
      }
    } catch (err: unknown) {
      console.error('Upgrade error:', err);
      const msg = "We couldn't start your payment. Please try again or contact support.";
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

        <div className="text-center">
          <CurrencySwitch value={currency} onChange={setCurrency} allowInr={allowInr} />
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
            price={formatMoney(0, currency)}
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
            price={formatMoney(proYearPrice, currency)}
            period="/year"
            features={proFeaturesFromConfig}
            badge="Recommended"
            isFeatured
            ctaLabel={isPro ? `Extend for ${formatMoney(proYearPrice, currency)}` : `Subscribe for ${formatMoney(proYearPrice, currency)}/year`}
            ctaAction={() => handleUpgrade('year')}
            ctaLoading={loadingCycle === 'year'}
            ctaDisabled={loadingCycle !== null}
            secondaryLabel={`~${usd ? '$' : '₹'}${perMonthOfYear}/month · ${proDiscountLabel}`}
          />

          {/* Card 3: Pro Monthly */}
          <PricingCard
            name="Pro Monthly"
            description="Flexible monthly subscription with the same unlimited access and priority support"
            price={formatMoney(proMonthPrice, currency)}
            period="/month"
            features={proFeaturesFromConfig}
            ctaLabel={isPro ? `Extend for ${formatMoney(proMonthPrice, currency)}` : `Subscribe for ${formatMoney(proMonthPrice, currency)}/month`}
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
            {usd ? 'Prices in USD; taxes are added at checkout where applicable. Payments secured by Dodo Payments.' : 'Prices in INR, taxes as applicable. Payments secured by Cashfree.'}
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

      {phonePromptCycle && (
        <PhonePrompt
          onCancel={() => setPhonePromptCycle(null)}
          onSubmit={(phone) => {
            const c = phonePromptCycle;
            setPhonePromptCycle(null);
            void handleUpgrade(c, phone);
          }}
        />
      )}

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

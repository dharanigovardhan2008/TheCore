'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { Order } from '@/lib/types';
import { createCheckoutSession } from '@/app/dashboard/actions';
import { BillingCycle } from '@/lib/plans';
import PaymentStatusModal from '@/components/ui/PaymentStatusModal';
import PricingCard from '@/components/ui/PricingCard';

interface CashfreeSDKInstance {
  checkout: (opts: { paymentSessionId: string; redirectTarget: string }) => Promise<void>;
}

type CashfreeInit = (opts: { mode: 'production' | 'sandbox' }) => CashfreeSDKInstance;

interface CashfreeWindow extends Window {
  Cashfree?: CashfreeInit;
}

interface BillingClientProps {
  usage: {
    plan: 'free' | 'pro';
    plan_expires_at: string | null;
    isPro: boolean;
    role: string;
    projectCount: number;
    limits: {
      maxProjects: number;
      maxEnvFilesPerProject: number;
    };
    orders: Order[];
    planConfigs?: any[];
  };
}

export default function BillingClient({ usage }: BillingClientProps) {
  const router = useRouter();
  const [loadingCycle, setLoadingCycle] = useState<BillingCycle | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentModalState, setPaymentModalState] = useState<'success' | 'failed' | null>(null);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);

  const proConfig = usage.planConfigs?.find((p: any) => p.id === 'pro');
  const proMonthPrice = proConfig?.price_month_rupees ?? 99;
  const proYearPrice = proConfig?.price_year_rupees ?? 999;
  const proDiscountLabel = proConfig?.discount_label || (proConfig?.discount_percent ? `Save ${proConfig.discount_percent}%` : 'Save 16%');

  const isPro = usage.isPro;
  const isUnlimitedProjects = !Number.isFinite(usage.limits.maxProjects);

  const proFeatures = [
    'Unlimited projects',
    'Unlimited encrypted .env files',
    'Multi-environment configurations',
    'Priority platform & database sync',
    'Direct developer support',
    'Early access to new features',
  ];

  const handleCheckout = async (cycleToUse: BillingCycle) => {
    try {
      setLoadingCycle(cycleToUse);
      setErrorMsg(null);
      setPaymentModalError(null);
      const session = await createCheckoutSession(cycleToUse);

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
          script.onerror = () => reject(new Error('Failed to load Cashfree script'));
          document.head.appendChild(script);
        });
      };

      try {
        const cashfree = await loadCashfreeSdk();
        await cashfree.checkout({
          paymentSessionId: session.paymentSessionId,
          redirectTarget: '_self',
        });
      } catch (sdkErr: unknown) {
        console.warn('SDK checkout fallback:', (sdkErr as Error)?.message);
        router.push(`/billing/return?order_id=${session.orderId}`);
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      const msg = (err as Error)?.message || "We couldn't complete your payment. Please try again or choose another payment method.";
      setErrorMsg(msg);
      setPaymentModalError(msg);
      setPaymentModalState('failed');
    } finally {
      setLoadingCycle(null);
    }
  };

  const handlePrintReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${order.cf_order_id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 650px; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #000; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #e6f4ea; color: #137333; font-size: 12px; font-weight: 600; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
            th, td { text-align: left; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; }
            th { color: #666; font-weight: 500; font-size: 12px; text-transform: uppercase; }
            .total { font-size: 20px; font-weight: 700; text-align: right; }
            .footer { font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">TheCore</div>
              <div style="font-size: 13px; color: #666; margin-top: 4px;">Developer Project & Vault Manager</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">${order.status}</span>
              <div style="font-size: 12px; color: #666; margin-top: 6px;">${new Date(order.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          <div style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            <strong>Order Reference:</strong> ${order.cf_order_id}<br/>
            <strong>Subscription Plan:</strong> TheCore Pro (${order.billing_cycle === 'year' ? '12 Months' : '1 Month'})<br/>
            <strong>Payment Method:</strong> Cashfree Payments (INR)
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Cycle</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>TheCore Pro Plan Subscription</td>
                <td>${order.billing_cycle === 'year' ? 'Annual (365 Days)' : 'Monthly (30 Days)'}</td>
                <td style="text-align: right;">₹${(order.amount_paise / 100).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Paid: ₹${(order.amount_paise / 100).toFixed(2)}
          </div>

          <div class="footer" style="margin-top: 40px;">
            Thank you for subscribing to TheCore. For billing inquiries, email billing@thecore.indevs.in.<br/>
            This is an electronically generated receipt.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back Navigation */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Settings
      </Link>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight mb-2">
            Billing & Plans
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Manage your subscription, resource limits, and payment history
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors group self-start sm:self-auto"
        >
          Compare plans
          <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-8 p-4 rounded-[20px] bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="space-y-10">
        {/* Current Subscription Overview */}
        <section>
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-5">
            Current Subscription
          </h2>

          <div className="bg-gradient-to-br from-[#F4FAF7] to-white rounded-[24px] border border-[var(--border-light)] p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Plan Details */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[26px] font-bold text-[var(--text-primary)]">
                      TheCore {isPro ? 'Pro' : 'Free'}
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isPro
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPro ? 'bg-blue-500' : 'bg-slate-500'}`} />
                      Active
                    </span>
                  </div>
                  <p className="text-[15px] text-[var(--text-secondary)]">
                    {isPro ? 'Unlimited Pro' : 'Free Tier'}
                  </p>
                </div>

                {isPro && usage.plan_expires_at && (
                  <div className="pt-4 border-t border-[var(--border-light)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Plan Expires</p>
                    <p className="text-base font-semibold text-[var(--text-primary)]">
                      {new Date(usage.plan_expires_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Resources & Security */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">Resources</p>
                  <div className="space-y-2.5 text-[15px] text-[var(--text-primary)]">
                    <div className="flex items-center justify-between">
                      <span>Projects</span>
                      <span className="font-semibold">
                        {usage.projectCount} / {isUnlimitedProjects ? '∞' : usage.limits.maxProjects}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Vault Files</span>
                      <span className="font-semibold">
                        {isPro ? 'Unlimited' : '1 per project'}
                      </span>
                    </div>
                    {isPro && (
                      <div className="flex items-center justify-between">
                        <span>Environments</span>
                        <span className="font-medium text-sm">.env, .env.local, .env.prod</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-light)]">
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Security</p>
                  <p className="text-sm text-[var(--text-primary)]">
                    AES-256-GCM encryption
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Zero-knowledge architecture
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Extension */}
        <section>
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-5">
            {isPro ? 'Extend Subscription' : 'Upgrade to Pro'}
          </h2>

          {/* Three-Card Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

            {/* Free Plan (Info Only) */}
            <div className="rounded-[28px] border border-[#DCE9E3] bg-white p-6 shadow-sm opacity-60">
              <div className="mb-5">
                <h3 className="text-xl font-bold text-[#172B2A] mb-2">Free</h3>
                <p className="text-xs text-[#647570] leading-relaxed min-h-[36px]">
                  Your current plan if not Pro
                </p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#172B2A]">₹0</span>
                  <span className="text-sm text-[#647570]">/forever</span>
                </div>
              </div>

              <div className="h-px w-full bg-[#DCE9E3] mb-5" />

              <p className="text-sm text-[#647570]">
                Up to 3 projects, 1 .env file per project
              </p>
            </div>

            {/* Pro Annual (Featured) */}
            <PricingCard
              name="Pro Annual"
              description="Best value with yearly billing and full Pro access"
              price={proYearPrice}
              period="/year"
              features={proFeatures.slice(0, 4)}
              badge="Recommended"
              isFeatured
              ctaLabel={isPro ? `Extend for ₹${proYearPrice}` : `Upgrade for ₹${proYearPrice}/year`}
              ctaAction={() => handleCheckout('year')}
              ctaLoading={loadingCycle === 'year'}
              ctaDisabled={loadingCycle !== null}
              secondaryLabel={`~₹${Math.round(proYearPrice / 12)}/month · ${proDiscountLabel}`}
            />

            {/* Pro Monthly */}
            <PricingCard
              name="Pro Monthly"
              description="Flexible monthly subscription with same unlimited access"
              price={proMonthPrice}
              period="/month"
              features={proFeatures.slice(0, 4)}
              ctaLabel={isPro ? `Extend for ₹${proMonthPrice}` : `Upgrade for ₹${proMonthPrice}/month`}
              ctaAction={() => handleCheckout('month')}
              ctaLoading={loadingCycle === 'month'}
              ctaDisabled={loadingCycle !== null}
              secondaryLabel="Billed monthly · Cancel anytime"
            />

          </div>

          <div className="text-center space-y-1">
            <p className="text-sm text-[var(--text-secondary)]">
              Secure checkout powered by Cashfree Payments
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              UPI, cards, and NetBanking supported · 7-day money-back guarantee
            </p>
          </div>
        </section>

        {/* Payment History */}
        <section>
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-5">
            Payment History
          </h2>

          <div className="bg-white rounded-[24px] border border-[var(--border-light)] overflow-hidden shadow-sm">
            {usage.orders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-[var(--text-primary)] mb-1">No transactions yet</h4>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
                  Your payment history and receipts will appear here after your first transaction
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] bg-[#F4FAF7]">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {usage.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#F4FAF7]/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-[var(--text-primary)] whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-[var(--text-secondary)]">
                          {order.cf_order_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                          {order.billing_cycle === 'year' ? '12 Months' : '1 Month'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                          ₹{(order.amount_paise / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : order.status === 'created'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              order.status === 'paid' ? 'bg-emerald-600' : order.status === 'created' ? 'bg-amber-600' : 'bg-red-600'
                            }`} />
                            {order.status === 'paid' ? 'Paid' : order.status === 'created' ? 'Pending' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {order.status === 'paid' ? (
                            <button
                              type="button"
                              onClick={() => handlePrintReceipt(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Invoice
                            </button>
                          ) : (
                            <span className="text-sm text-[var(--text-tertiary)]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Payment Status Modal */}
      {paymentModalState && (
        <PaymentStatusModal
          isOpen={true}
          status={paymentModalState}
          description={paymentModalError || undefined}
          onPrimaryClick={() => {
            setPaymentModalState(null);
          }}
          onSecondaryClick={() => setPaymentModalState(null)}
          onClose={() => setPaymentModalState(null)}
        />
      )}
    </div>
  );
}

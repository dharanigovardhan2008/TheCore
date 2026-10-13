'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import type { Order } from '@/lib/types';
import { createCheckoutSession } from '@/app/dashboard/actions';
import { BillingCycle } from '@/lib/plans';

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
  };
}

export default function BillingClient({ usage }: BillingClientProps) {
  const router = useRouter();
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('year');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPro = usage.isPro;
  const isUnlimitedProjects = !Number.isFinite(usage.limits.maxProjects);
  const projectPct = isUnlimitedProjects
    ? 15
    : Math.min(100, Math.round((usage.projectCount / usage.limits.maxProjects) * 100));

  const handleCheckout = async (cycleToUse: BillingCycle) => {
    try {
      setLoading(true);
      setErrorMsg(null);
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
      setErrorMsg((err as Error)?.message || 'Failed to start payment session.');
    } finally {
      setLoading(false);
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
    <div className="max-w-4xl mx-auto pb-16 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Settings</span>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-primary)] font-medium">Billing & Plans</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Billing & Plans</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Manage your subscription tier, resource quotas, and Cashfree invoices.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass hover:bg-white/90 dark:hover:bg-black/50 text-xs font-semibold text-indigo-600 border border-white/80 shadow-xs transition-premium self-start sm:self-auto group"
          >
            <span>Compare all plan features</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Hero Current Subscription Card */}
      <section>
        <div className="glass rounded-[var(--radius-panel)] p-6 sm:p-8 shadow-[var(--shadow-soft)] relative overflow-hidden border border-white/80 dark:border-white/10">
          {/* Ambient Lighting Aura */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-blue-500/15 blur-3xl pointer-events-none" />

          {/* Top Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span>Current Plan</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  {isPro ? 'TheCore Pro' : 'Free Starter'}
                </h2>
                {isPro ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center gap-1.5 shadow-2xs">
                    <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    Unlimited Pro
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/40">
                    Free Tier
                  </span>
                )}
              </div>

              <p className="text-sm text-[var(--text-secondary)] max-w-xl">
                {isPro
                  ? 'Unlimited project spaces, client-side encrypted .env vaults, and instant platform syncing.'
                  : 'Free tier: up to 3 projects and 1 encrypted .env file per project. Upgrade anytime.'}
              </p>
            </div>

            {/* Expiration or Upgrade CTA */}
            <div className="shrink-0">
              {isPro ? (
                <div className="flex items-center gap-3.5 p-3.5 sm:px-5 sm:py-3.5 rounded-2xl bg-white/70 dark:bg-black/30 border border-white/80 dark:border-white/10 shadow-xs backdrop-blur-md">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Access Expires On
                    </div>
                    <div className="text-sm font-extrabold text-[var(--text-primary)]">
                      {usage.plan_expires_at
                        ? new Date(usage.plan_expires_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Permanent Access'}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCheckout('year')}
                  disabled={loading}
                  className="px-6 py-3 rounded-[var(--radius-btn)] bg-gradient-to-r from-[var(--color-primary)] to-[#818CF8] hover:scale-105 active:scale-95 text-white text-xs font-bold uppercase tracking-wider shadow-[0_4px_16px_rgba(79,70,229,0.35)] transition-premium flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                  <span>Upgrade to Pro</span>
                </button>
              )}
            </div>
          </div>

          {/* Quota & Feature Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-white/10 relative z-10">
            {/* Active Projects Metric */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/10 shadow-2xs backdrop-blur-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    Projects
                  </span>
                  <span className="text-xs font-extrabold text-[var(--text-primary)]">
                    {usage.projectCount} <span className="font-normal text-[var(--text-tertiary)]">/ {isUnlimitedProjects ? '∞' : usage.limits.maxProjects}</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200/60 dark:bg-slate-800 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlimitedProjects
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        : projectPct >= 100
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${projectPct}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                {isUnlimitedProjects ? 'Unlimited project spaces available' : `${usage.limits.maxProjects - usage.projectCount} projects remaining on Free`}
              </p>
            </div>

            {/* .env Files Metric */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/10 shadow-2xs backdrop-blur-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                      <FileCode className="w-3.5 h-3.5" />
                    </div>
                    Vault Files
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600">
                    {isPro ? 'Unlimited' : '1 / project'}
                  </span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] mb-1">
                  {isPro ? 'Multi-Environment' : 'Single .env'}
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                {isPro ? '.env, .env.local, .env.prod per project' : 'Upgrade to Pro for unlimited files'}
              </p>
            </div>

            {/* Security & Sync Metric */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/10 shadow-2xs backdrop-blur-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    Encryption
                  </span>
                  <span className="text-xs font-extrabold text-blue-600">
                    Zero-Knowledge
                  </span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] mb-1">
                  AES-256-GCM
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                Vault keys never touch the database
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plan Extension / Subscription Options */}
      <section>
        <div className="px-4 sm:px-0 mb-4 text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          {isPro ? 'Extend Pro Access' : 'Select Subscription Tier'}
        </div>

        <div className="glass rounded-[var(--radius-panel)] p-6 sm:p-8 shadow-[var(--shadow-soft)] border border-white/80 dark:border-white/10 space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {isPro ? 'Extend your Pro subscription' : 'Unlock unlimited power with TheCore Pro'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Secure checkout provided by Cashfree Payments. Instant activation upon bank authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Monthly Option Card */}
            <div
              onClick={() => setSelectedCycle('month')}
              className={`p-6 rounded-2xl border transition-premium cursor-pointer flex flex-col justify-between relative backdrop-blur-md ${
                selectedCycle === 'month'
                  ? 'border-indigo-400/90 bg-white/95 dark:bg-black/40 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-400/20'
                  : 'border-white/80 dark:border-white/10 bg-white/50 dark:bg-black/20 hover:border-indigo-200/80 hover:bg-white/80 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      selectedCycle === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'border border-slate-300/80 bg-white/80'
                    }`}>
                      {selectedCycle === 'month' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="font-bold text-base text-[var(--text-primary)]">Monthly Plan</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[var(--text-primary)]">₹99</span>
                    <span className="text-xs text-[var(--text-secondary)] ml-1">/ month</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  Flexible month-to-month access. Extends subscription by 30 days.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/10 text-xs text-[var(--text-primary)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedCycle === 'month' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Unlimited projects & .env vaults</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedCycle === 'month' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Full access for 30 days</span>
                </div>
              </div>
            </div>

            {/* Annual Option Card (Featured) */}
            <div
              onClick={() => setSelectedCycle('year')}
              className={`p-6 rounded-2xl border transition-premium cursor-pointer flex flex-col justify-between relative backdrop-blur-md ${
                selectedCycle === 'year'
                  ? 'border-indigo-400/90 bg-white/95 dark:bg-black/40 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-400/20'
                  : 'border-white/80 dark:border-white/10 bg-white/50 dark:bg-black/20 hover:border-indigo-200/80 hover:bg-white/80 shadow-xs'
              }`}
            >
              {/* Savings Badge - Clean typography without AI sparkles */}
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                Save 16% • Best Value
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      selectedCycle === 'year' ? 'bg-indigo-600 text-white shadow-xs' : 'border border-slate-300/80 bg-white/80'
                    }`}>
                      {selectedCycle === 'year' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="font-bold text-base text-[var(--text-primary)]">Annual Plan</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[var(--text-primary)]">₹999</span>
                    <span className="text-xs text-[var(--text-secondary)] ml-1">/ year</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  Billed annually. Extends subscription by 365 days (equivalent to ₹83/month).
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/10 text-xs text-[var(--text-primary)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedCycle === 'year' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Full year (365 days) uninterrupted Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedCycle === 'year' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Includes 7-day money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pt-6 border-t border-slate-100 dark:border-white/10">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center sm:justify-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Secure Checkout via Cashfree PG</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Supports UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, and NetBanking.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCheckout(selectedCycle)}
              disabled={loading}
              className="w-full sm:w-auto h-12 px-8 rounded-[var(--radius-btn)] bg-gradient-to-r from-[var(--color-primary)] via-indigo-600 to-[#818CF8] hover:scale-105 active:scale-95 text-white font-semibold text-sm shadow-[0_6px_20px_rgba(79,70,229,0.35)] transition-premium flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:scale-100 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Cashfree...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{isPro ? `Extend Pro for ₹${selectedCycle === 'year' ? '999' : '99'}` : `Upgrade to Pro for ₹${selectedCycle === 'year' ? '999' : '99'}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Payment & Order History Table */}
      <section>
        <div className="px-4 sm:px-0 mb-4 text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-2">
          <FileCode className="h-4 w-4" />
          Payment History & Invoices
        </div>

        <div className="glass rounded-[var(--radius-panel)] p-6 sm:p-8 shadow-[var(--shadow-soft)] border border-white/60 dark:border-white/10 overflow-hidden">
          {usage.orders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto shadow-2xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">No orders or transactions yet</h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                When you purchase or renew a subscription via Cashfree, all receipts and invoice downloads will be recorded here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-light)] text-[var(--text-secondary)]">
                    <th className="pb-3.5 font-bold uppercase tracking-wider text-[10px]">Date</th>
                    <th className="pb-3.5 font-bold uppercase tracking-wider text-[10px]">Order ID</th>
                    <th className="pb-3.5 font-bold uppercase tracking-wider text-[10px]">Period</th>
                    <th className="pb-3.5 font-bold uppercase tracking-wider text-[10px]">Amount</th>
                    <th className="pb-3.5 font-bold uppercase tracking-wider text-[10px]">Status</th>
                    <th className="pb-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {usage.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 text-[var(--text-secondary)] font-medium">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-4 font-mono text-[11px] text-[var(--text-primary)]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                          {order.cf_order_id}
                        </span>
                      </td>
                      <td className="py-4 font-semibold text-[var(--text-primary)] capitalize">
                        {order.billing_cycle === 'year' ? '12 Months' : '1 Month'}
                      </td>
                      <td className="py-4 font-bold text-[var(--text-primary)] text-sm">
                        ₹{(order.amount_paise / 100).toFixed(2)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.status === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                              : order.status === 'created'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            order.status === 'paid' ? 'bg-emerald-500' : order.status === 'created' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {order.status === 'paid' ? (
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-[11px] transition-colors border border-blue-200/60 shadow-2xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        ) : (
                          <span className="text-[var(--text-tertiary)] font-mono">—</span>
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
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Zap,
  CheckCircle2,
  ArrowUpRight,
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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[var(--separator)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
          <p className="text-sm text-[var(--text-content-secondary)] mt-1">
            Manage your subscription tier, usage quotas, and Cashfree invoice history.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
        >
          Compare all plan features <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">Current Subscription</span>
              {isPro ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-blue-500" />
                  TheCore Pro
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-grouped)] text-[var(--text-content-secondary)] border border-[var(--separator)]">
                  Free Starter
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text-content-secondary)]">
              {isPro
                ? 'Unlimited projects, unlimited environment files, and priority platform syncing.'
                : 'Free plan: up to 3 projects and 1 encrypted .env file per project.'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            {isPro ? (
              <div>
                <div className="text-xs text-[var(--text-content-secondary)]">Access expires on</div>
                <div className="text-sm font-semibold flex items-center gap-1.5 mt-0.5 sm:justify-end">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {usage.plan_expires_at
                    ? new Date(usage.plan_expires_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Permanent Pro'}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleCheckout('year')}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        {/* Usage Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[var(--separator)]">
          <div className="p-4 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[var(--text-content-secondary)] font-medium flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Active Projects
              </span>
              <span className="font-semibold">
                {usage.projectCount} / {isUnlimitedProjects ? 'Unlimited' : usage.limits.maxProjects}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--separator)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isUnlimitedProjects
                    ? 'bg-blue-500'
                    : projectPct >= 100
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${projectPct}%` }}
              ></div>
            </div>
            {!isUnlimitedProjects && usage.projectCount >= usage.limits.maxProjects && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                Project limit reached. Upgrade to Pro to create more.
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[var(--text-content-secondary)] font-medium flex items-center gap-1.5">
                <FileCode className="w-4 h-4" /> .env Files per Project
              </span>
              <span className="font-semibold">
                {isPro ? 'Unlimited' : '1 per project'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-content-secondary)] mt-1">
              {isPro
                ? 'Store multiple .env files (.env, .env.local, .env.prod) per project.'
                : 'Free tier permits 1 encrypted .env file per project.'}
            </p>
          </div>
        </div>
      </div>

      {/* Extend or Upgrade Options */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm">
        <h2 className="text-base font-semibold mb-2">
          {isPro ? 'Extend Pro Subscription' : 'Choose Your Pro Subscription'}
        </h2>
        <p className="text-xs text-[var(--text-content-secondary)] mb-6">
          Payment processed securely by Cashfree Payments. All major UPI, Cards, and NetBanking accepted.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Monthly Option */}
          <div
            onClick={() => setSelectedCycle('month')}
            className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedCycle === 'month'
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-[var(--separator)] bg-[var(--bg-grouped)] hover:border-[var(--text-content-tertiary)]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Monthly Plan</span>
                <span className="text-lg font-bold">₹99</span>
              </div>
              <p className="text-xs text-[var(--text-content-secondary)]">
                Billed monthly. Renews or extends 30 days of unlimited access.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--separator)] flex items-center gap-2 text-xs text-[var(--text-content-secondary)]">
              <CheckCircle2 className={`w-4 h-4 ${selectedCycle === 'month' ? 'text-blue-500' : 'text-gray-400'}`} />
              <span>Full Pro features for 1 month</span>
            </div>
          </div>

          {/* Annual Option */}
          <div
            onClick={() => setSelectedCycle('year')}
            className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
              selectedCycle === 'year'
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-[var(--separator)] bg-[var(--bg-grouped)] hover:border-[var(--text-content-tertiary)]'
            }`}
          >
            <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
              Save 16%
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Annual Plan</span>
                <span className="text-lg font-bold">₹999</span>
              </div>
              <p className="text-xs text-[var(--text-content-secondary)]">
                Billed annually. Extends 365 days of unlimited access.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--separator)] flex items-center gap-2 text-xs text-[var(--text-content-secondary)]">
              <CheckCircle2 className={`w-4 h-4 ${selectedCycle === 'year' ? 'text-blue-500' : 'text-gray-400'}`} />
              <span>Best value (equivalent to ₹83/month)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--separator)]">
          <div className="text-xs text-[var(--text-content-secondary)] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Prices in INR, taxes as applicable. Includes 7-day refund guarantee for annual plans.</span>
          </div>

          <button
            type="button"
            onClick={() => handleCheckout(selectedCycle)}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                {isPro ? 'Extend Pro with Cashfree' : 'Pay with Cashfree'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Order History Table */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm">
        <h2 className="text-base font-semibold mb-4">Payment & Order History</h2>

        {usage.orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-content-secondary)] bg-[var(--bg-grouped)] rounded-xl border border-[var(--separator)]">
            No payment transactions yet. When you upgrade or renew, receipts will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--separator)] text-[var(--text-content-secondary)]">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Cycle</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--separator)]">
                {usage.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--bg-grouped)] transition-colors">
                    <td className="py-3 text-[var(--text-content-secondary)]">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-mono text-[11px]">{order.cf_order_id}</td>
                    <td className="py-3 capitalize">{order.billing_cycle === 'year' ? '12 Months' : '1 Month'}</td>
                    <td className="py-3 font-semibold">₹{(order.amount_paise / 100).toFixed(2)}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                          order.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : order.status === 'created'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {order.status === 'paid' ? (
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(order)}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Receipt
                        </button>
                      ) : (
                        <span className="text-[var(--text-content-tertiary)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


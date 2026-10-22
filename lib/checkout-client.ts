'use client';

import type { CheckoutSessionResult } from '@/app/dashboard/actions';

interface CashfreeSDKInstance {
  checkout: (opts: {
    paymentSessionId: string;
    redirectTarget?: string;
    returnUrl?: string;
  }) => Promise<{ error?: { message: string }; redirect?: boolean }>;
}
type CashfreeInit = (opts: { mode: 'production' | 'sandbox' }) => CashfreeSDKInstance;
interface CashfreeWindow extends Window {
  Cashfree?: CashfreeInit;
}

function loadCashfree(mode: 'production' | 'sandbox'): Promise<CashfreeSDKInstance> {
  const win = window as unknown as CashfreeWindow;
  if (win.Cashfree) return Promise.resolve(win.Cashfree({ mode }));
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => {
      const loaded = window as unknown as CashfreeWindow;
      if (loaded.Cashfree) resolve(loaded.Cashfree({ mode }));
      else reject(new Error('Cashfree SDK failed to initialize'));
    };
    script.onerror = () => reject(new Error('Failed to load the Cashfree checkout script'));
    document.head.appendChild(script);
  });
}

/**
 * Open the hosted checkout for a started session.
 * Returns an error message, or null when the browser has been handed over to the provider.
 */
export async function launchCheckout(
  session: Extract<CheckoutSessionResult, { ok: true }>
): Promise<string | null> {
  if (session.provider === 'dodo') {
    window.location.assign(session.checkoutUrl);
    return null;
  }
  try {
    const cashfree = await loadCashfree(session.environment);
    // If the browser is handed over to Cashfree this page unloads and the timer never matters.
    // If something blocks the redirect, fail loudly instead of leaving a blurred, stuck screen.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Cashfree checkout did not open')), 20000)
    );
    const result = await Promise.race([
      cashfree.checkout({
        paymentSessionId: session.paymentSessionId,
        redirectTarget: '_self',
        returnUrl: session.returnUrl,
      }),
      timeout,
    ]);
    if (result?.error) {
      return result.error.message || "We couldn't complete your payment. Please try again.";
    }
    return null;
  } catch (err) {
    console.warn('Cashfree checkout error:', (err as Error)?.message);
    // Let the return page confirm the real status from Cashfree.
    window.location.assign(`/billing/return?order_id=${encodeURIComponent(session.orderId)}`);
    return null;
  }
}

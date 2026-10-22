import crypto from 'node:crypto';
import type { BillingCycle } from '@/lib/plans';

/**
 * Dodo Payments (international, USD, merchant of record). Server-only.
 * Plain fetch + Standard Webhooks signature check, so no extra npm package is needed.
 * One Dodo account can serve all Opsyl products; this app acts only on its own product IDs.
 */

export function getDodoEnvironment(): 'live_mode' | 'test_mode' {
  return (process.env.DODO_PAYMENTS_ENVIRONMENT || '').trim().toLowerCase() === 'live_mode' ? 'live_mode' : 'test_mode';
}

const BASE_URL = {
  live_mode: 'https://live.dodopayments.com',
  test_mode: 'https://test.dodopayments.com',
} as const;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Add it to the environment (never commit it).`);
  }
  return value;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function dodoFetch<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${BASE_URL[getDodoEnvironment()]}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${requireEnv('DODO_PAYMENTS_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Dodo API ${res.status} on ${init?.method ?? 'GET'} ${path}: ${text.slice(0, 300)}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export function getDodoProductId(cycle: BillingCycle): string {
  return requireEnv(cycle === 'year' ? 'DODO_PRODUCT_ID_YEARLY' : 'DODO_PRODUCT_ID_MONTHLY');
}

/** Map a Dodo product ID back to our billing cycle. Returns null for any product that is not ours. */
export function cycleFromDodoProductId(productId: string | null | undefined): BillingCycle | null {
  if (!productId) return null;
  if (productId === process.env.DODO_PRODUCT_ID_MONTHLY?.trim()) return 'month';
  if (productId === process.env.DODO_PRODUCT_ID_YEARLY?.trim()) return 'year';
  return null;
}

/**
 * Safety check before sending a customer to checkout: the Dodo product's USD price must equal the price we
 * show (plan_configs). If Dodo's response does not expose a readable price we log and continue, because the
 * webhook also refuses to grant Pro when the paid amount is lower than our price.
 */
export async function assertDodoProductPrice(productId: string, expectedCents: number): Promise<void> {
  const product = await dodoFetch<any>(`/products/${productId}`);
  if (product?.is_archived) {
    throw new Error('This plan is currently unavailable. Please contact support.');
  }
  const detail = product?.price_detail ?? product?.price ?? null;
  const amount = Number(detail && typeof detail === 'object' ? detail.price ?? detail.fixed_price : detail);
  const currency = String((detail && typeof detail === 'object' ? detail.currency : product?.currency) ?? '').toUpperCase();

  if (!Number.isFinite(amount) || amount <= 0) {
    console.warn('[Dodo] Could not read the product price; skipping the price pre-check', { productId });
    return;
  }
  if (amount !== expectedCents || (currency && currency !== 'USD')) {
    console.error('[Dodo] Product price does not match plan_configs', { productId, expectedCents, dodoAmount: amount, currency });
    throw new Error('Pricing is being updated. Please try again shortly or contact support.');
  }
}

export async function createDodoCheckout(params: {
  productId: string;
  userId: string;
  email: string;
  name?: string;
  orderRef: string;
  cycle: BillingCycle;
  returnUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const session = await dodoFetch<{ session_id: string; checkout_url: string | null }>('/checkouts', {
    method: 'POST',
    body: {
      product_cart: [{ product_id: params.productId, quantity: 1 }],
      customer: { email: params.email, ...(params.name ? { name: params.name } : {}) },
      return_url: params.returnUrl,
      metadata: {
        app: 'thecore',
        user_id: params.userId,
        order_ref: params.orderRef,
        cycle: params.cycle,
      },
      // Fixed price in USD, no discount codes: the amount must match what we show.
      feature_flags: { allow_discount_code: false, allow_currency_selection: false },
    },
  });
  if (!session.session_id || !session.checkout_url) {
    throw new Error('Dodo did not return a checkout URL');
  }
  return { sessionId: session.session_id, url: session.checkout_url };
}

export const getDodoSubscription = (id: string) => dodoFetch<any>(`/subscriptions/${id}`);
export const getDodoPayment = (id: string) => dodoFetch<any>(`/payments/${id}`);
export const getDodoCheckoutSession = (id: string) => dodoFetch<any>(`/checkouts/${id}`);

/** Link to Dodo's customer portal (cancel, update card, invoices). */
export async function createDodoPortalLink(customerId: string, returnUrl?: string): Promise<string> {
  const session = await dodoFetch<{ link: string }>(`/customers/${customerId}/customer-portal/session`, {
    method: 'POST',
    body: returnUrl ? { return_url: returnUrl } : {},
  });
  if (!session.link) throw new Error('Dodo did not return a portal link');
  return session.link;
}

/** Stop a subscription right away so it can never charge again. Best-effort. */
export async function cancelDodoSubscriptionNow(subscriptionId: string): Promise<void> {
  try {
    await dodoFetch(`/subscriptions/${subscriptionId}`, { method: 'PATCH', body: { status: 'cancelled' } });
  } catch (err) {
    console.warn('[Dodo] Could not cancel subscription', subscriptionId, (err as Error)?.message);
  }
}

export class DodoWebhookVerificationError extends Error {}

/**
 * Verify a Standard Webhooks signature on the RAW body and return the parsed event.
 * Throws DodoWebhookVerificationError when the signature or timestamp is not valid.
 */
export function parseDodoWebhook(rawBody: string, headers: Headers): { type: string; timestamp?: string; data: any } {
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) {
    throw new DodoWebhookVerificationError('Missing webhook headers');
  }

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > 5 * 60) {
    throw new DodoWebhookVerificationError('Webhook timestamp is outside the allowed window');
  }

  const secret = requireEnv('DODO_WEBHOOK_SECRET');
  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret, 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest();

  const matches = signatureHeader.split(' ').some((part) => {
    const [version, signature] = part.split(',');
    if (version !== 'v1' || !signature) return false;
    const given = Buffer.from(signature, 'base64');
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
  if (!matches) {
    throw new DodoWebhookVerificationError('Invalid webhook signature');
  }

  return JSON.parse(rawBody);
}

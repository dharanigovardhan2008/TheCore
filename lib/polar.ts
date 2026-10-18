import { createPolar, webhooks } from '@polar-sh/sdk/2026-10';
import type { BillingCycle } from '@/lib/plans';

/**
 * Polar (international, USD, merchant of record). Server-only.
 * One Polar organization for all Opsyl products; this app acts only on its own product IDs.
 */

export function getPolarEnvironment(): 'sandbox' | 'production' {
  return (process.env.POLAR_SERVER || '').toLowerCase() === 'production' ? 'production' : 'sandbox';
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Add it to the environment (never commit it).`);
  }
  return value;
}

let cachedClient: ReturnType<typeof createPolar> | null = null;
export function getPolarClient() {
  if (!cachedClient) {
    cachedClient = createPolar({
      accessToken: requireEnv('POLAR_ACCESS_TOKEN'),
      environment: getPolarEnvironment(),
    });
  }
  return cachedClient;
}

export function getPolarProductId(cycle: BillingCycle): string {
  return requireEnv(cycle === 'year' ? 'POLAR_PRODUCT_ID_YEARLY' : 'POLAR_PRODUCT_ID_MONTHLY');
}

/** Map a Polar product ID back to our billing cycle. Returns null for any product that is not ours. */
export function cycleFromPolarProductId(productId: string | null | undefined): BillingCycle | null {
  if (!productId) return null;
  if (productId === process.env.POLAR_PRODUCT_ID_MONTHLY?.trim()) return 'month';
  if (productId === process.env.POLAR_PRODUCT_ID_YEARLY?.trim()) return 'year';
  return null;
}

/**
 * Safety check before sending a customer to checkout: the Polar product's fixed USD price must equal the price
 * we show (plan_configs). If they differ the customer would be charged one amount and we would refuse to
 * fulfil because of the amount check, so we stop here instead.
 */
export async function assertPolarProductPrice(productId: string, expectedCents: number): Promise<void> {
  const polar = getPolarClient();
  const product = await polar.products.get(productId);
  if (product.is_archived) {
    throw new Error('This plan is currently unavailable. Please contact support.');
  }
  const prices = (product.prices ?? []) as Array<{
    amount_type?: string;
    price_amount?: number;
    price_currency?: string;
    is_archived?: boolean;
  }>;
  const fixed = prices.find(
    (p) => !p.is_archived && p.amount_type === 'fixed' && (p.price_currency || '').toLowerCase() === 'usd'
  );
  if (!fixed || fixed.price_amount !== expectedCents) {
    console.error('[Polar] Product price does not match plan_configs', {
      productId,
      expectedCents,
      polarCents: fixed?.price_amount ?? null,
    });
    throw new Error('Pricing is being updated. Please try again shortly or contact support.');
  }
}

export async function createPolarCheckout(params: {
  productId: string;
  userId: string;
  email: string;
  name?: string;
  orderRef: string;
  cycle: BillingCycle;
  successUrl: string;
}): Promise<{ checkoutId: string; url: string }> {
  const polar = getPolarClient();
  const checkout = await polar.checkouts.create({
    products: [params.productId],
    external_customer_id: params.userId,
    customer_email: params.email,
    customer_name: params.name || undefined,
    success_url: params.successUrl,
    metadata: {
      app: 'thecore',
      user_id: params.userId,
      order_ref: params.orderRef,
      cycle: params.cycle,
    },
  });
  return { checkoutId: checkout.id, url: checkout.url };
}

/** Full refund: stop the subscription so it does not renew and charge again. Best-effort. */
export async function revokePolarSubscription(subscriptionId: string): Promise<void> {
  try {
    await getPolarClient().subscriptions.revoke(subscriptionId);
  } catch (err) {
    console.warn('[Polar] Could not revoke subscription', subscriptionId, (err as Error)?.message);
  }
}

/**
 * Verify the signature on the RAW body and parse the event.
 * Throws webhooks.PolarWebhookVerificationError / PolarWebhookError on failure.
 */
export async function parsePolarWebhook(rawBody: string, headers: Headers) {
  return webhooks.validateEvent(
    rawBody,
    {
      'webhook-id': headers.get('webhook-id') ?? '',
      'webhook-timestamp': headers.get('webhook-timestamp') ?? '',
      'webhook-signature': headers.get('webhook-signature') ?? '',
    },
    requireEnv('POLAR_WEBHOOK_SECRET')
  );
}

export { webhooks as polarWebhooks };

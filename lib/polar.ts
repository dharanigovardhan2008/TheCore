
import { createPolar } from '@polar-sh/sdk/2026-10';
import { webhooks } from '@polar-sh/sdk/2026-10';
const { validateEvent } = webhooks;
import { createAdminClient } from '@/utils/supabase/admin';
import { type BillingCycle } from '@/lib/plans';

export const polar = createPolar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
  environment: (process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox'),
});

export const POLAR_PRODUCT_ID_MONTHLY = process.env.POLAR_PRODUCT_ID_MONTHLY;
export const POLAR_PRODUCT_ID_YEARLY = process.env.POLAR_PRODUCT_ID_YEARLY;

/**
 * Get Polar product ID for a billing cycle.
 * @throws Error if Polar product ID is not configured
 */
export function getPolarProductIdByCycle(cycle: BillingCycle): string {
  const productId = cycle === 'year' ? POLAR_PRODUCT_ID_YEARLY : POLAR_PRODUCT_ID_MONTHLY;
  if (!productId) {
    throw new Error(`Polar product ID for cycle ${cycle} is not configured. Check environment variables POLAR_PRODUCT_ID_MONTHLY and POLAR_PRODUCT_ID_YEARLY.`);
  }
  return productId;
}

/**
 * Get billing cycle from Polar product ID.
 * @throws Error if Polar product IDs are not configured
 */
export function cycleFromPolarProductId(productId: string): BillingCycle {
  if (!POLAR_PRODUCT_ID_YEARLY || !POLAR_PRODUCT_ID_MONTHLY) {
    throw new Error('Polar product IDs are not configured. Check environment variables POLAR_PRODUCT_ID_MONTHLY and POLAR_PRODUCT_ID_YEARLY.');
  }
  return productId === POLAR_PRODUCT_ID_YEARLY ? 'year' : 'month';
}

/**
 * Create a Polar checkout session.
 * @param cycle - billing cycle ('month' or 'year')
 * @param customerEmail - customer email
 * @param externalCustomerId - external customer ID (user.id)
 * @param successUrl - URL to redirect after successful checkout
 * @returns { id: string; url: string } or throws error
 */
export async function createPolarCheckout(
  cycle: BillingCycle,
  customerEmail: string,
  externalCustomerId: string,
  successUrl: string
): Promise<{ id: string; url: string }> {
  const productId = getPolarProductIdByCycle(cycle);

  // Use the Polar SDK to create a checkout
  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      customer_email: customerEmail,
      external_customer_id: externalCustomerId,
      success_url: successUrl,
      metadata: {
        app: 'thecore',
      },
    });

    return { id: checkout.id, url: checkout.url };
  } catch (error) {
    console.error('Error creating Polar checkout:', error);
    throw error;
  }
}

/**
 * Revoke a Polar subscription.
 * @param subscriptionId - Polar subscription ID
 */
export async function revokePolarSubscription(subscriptionId: string): Promise<void> {
  try {
    await polar.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    console.error('Error revoking Polar subscription:', error);
    throw error;
  }
}

/**
 * Create a Polar customer portal session.
 * @param customerId - Polar customer ID
 * @returns { url: string } or throws error
 */
export async function createCustomerPortalSession(customerId: string): Promise<{ url: string }> {
  try {
    // Create a customer session using the customerSessions.create method
    const customerSession = await polar.customerSessions.create({
      customer_id: customerId,
    });

    return { url: customerSession.customer_portal_url };
  } catch (error) {
    console.error('Error creating Polar customer portal session:', error);
    throw error;
  }
}

/**
 * Assert that the Polar product price matches our plan config.
 * @param cycle - billing cycle
 * @throws Error if price mismatch
 */
export async function assertPolarProductPrice(cycle: BillingCycle): Promise<void> {
  const productId = getPolarProductIdByCycle(cycle);

  // Fetch the product from Polar
  const product = await polar.products.get(productId);

  // Get our plan config price in USD cents
  const supabase = await createAdminClient();
  const { data: planConfig } = await supabase
    .from('plan_configs')
    .select(`price_month_usd, price_year_usd`)
    .eq('id', 'pro')
    .single();

  let ourPriceCents: number;
  if (cycle === 'year') {
    ourPriceCents = Math.round((planConfig?.price_year_usd ?? 0) * 100); // Convert USD to cents
  } else {
    ourPriceCents = Math.round((planConfig?.price_month_usd ?? 0) * 100);
  }

  // Find the price that matches our currency (USD)
  const usdPrice = product.prices.find(p => p.price_currency === 'usd');
  if (!usdPrice) {
    throw new Error(`Polar product ${productId} has no USD price configured`);
  }

  // Handle different price types to get the amount
  let priceAmount: number;
  if ('price_amount' in usdPrice) {
    // Fixed price
    priceAmount = usdPrice.price_amount;
  } else if ('minimum_amount' in usdPrice && usdPrice.minimum_amount !== null) {
    // Custom price - use minimum amount as the price
    priceAmount = usdPrice.minimum_amount;
  } else {
    throw new Error(`Unable to determine price for Polar product ${productId}`);
  }

  if (priceAmount !== ourPriceCents) {
    throw new Error(`Polar product price mismatch: Polar price ${priceAmount} cents, our price ${ourPriceCents} cents`);
  }
}
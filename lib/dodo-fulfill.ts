/* eslint-disable @typescript-eslint/no-explicit-any */
import type { createAdminClient } from '@/utils/supabase/admin';
import { cycleFromDodoProductId, getDodoSubscription } from '@/lib/dodo';

type AdminDb = ReturnType<typeof createAdminClient>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Our user ID: taken from the checkout metadata, else from the subscription we already stored on the profile. */
export async function resolveDodoUserId(
  adminDb: AdminDb,
  metadatas: Array<Record<string, unknown> | null | undefined>,
  subscriptionId: string | null
): Promise<string | null> {
  for (const meta of metadatas) {
    const fromMeta = meta?.user_id;
    if (typeof fromMeta === 'string' && UUID_RE.test(fromMeta)) return fromMeta;
  }
  if (subscriptionId) {
    const { data } = await adminDb.from('profiles').select('id').eq('polar_subscription_id', subscriptionId).maybeSingle();
    if (data?.id) return data.id as string;
  }
  return null;
}

/**
 * Grant or extend Pro for a successful Dodo payment (first payment or renewal).
 * Used by the webhook AND by the return page, so Pro is activated even if the webhook is late.
 * Safe to call many times: the database function only fulfils a payment once.
 * Returns: fulfilled | duplicate | mismatch | not_found | ignored: ...
 */
export async function fulfillDodoPayment(adminDb: AdminDb, payment: any): Promise<string> {
  const paymentId: string | undefined = payment?.payment_id;
  const subscriptionId: string | null = payment?.subscription_id ?? null;
  if (!paymentId || !subscriptionId) return 'ignored: not a subscription payment';

  // The subscription tells us which product (month / year) was bought and when the period ends.
  const sub = await getDodoSubscription(subscriptionId);
  const cycle = cycleFromDodoProductId(sub?.product_id);
  if (!cycle) return 'ignored: not a TheCore product';

  const userId = await resolveDodoUserId(adminDb, [payment?.metadata, sub?.metadata], subscriptionId);
  if (!userId) {
    console.error('[Dodo] paid payment without a resolvable user', paymentId);
    return 'ignored: no user';
  }

  // Our price for this plan (USD cents).
  const { data: plan } = await adminDb
    .from('plan_configs')
    .select('price_month_usd, price_year_usd')
    .eq('id', 'pro')
    .maybeSingle();
  const expectedCents = Math.round(Number(cycle === 'year' ? plan?.price_year_usd : plan?.price_month_usd) * 100);

  // First payment of a checkout we created: use that order. Anything else is a renewal.
  const candidate: string | null =
    typeof payment?.metadata?.order_ref === 'string'
      ? payment.metadata.order_ref
      : typeof sub?.metadata?.order_ref === 'string'
        ? sub.metadata.order_ref
        : null;

  let orderRef = `core_renew_${paymentId}`;
  let expectedAmount = expectedCents;
  if (candidate) {
    const { data: order } = await adminDb
      .from('orders')
      .select('cf_order_id, amount_paise, status')
      .eq('provider', 'dodo')
      .eq('cf_order_id', candidate)
      .maybeSingle();
    if (order && ['created', 'failed', 'expired'].includes(order.status)) {
      orderRef = order.cf_order_id;
      expectedAmount = order.amount_paise;
    }
  }

  // Dodo's total includes tax, so it can never be lower than our price. Lower means a discount or a wrong price.
  const total = Number(payment?.total_amount);
  const currency = String(payment?.currency || sub?.currency || '').toUpperCase();
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 || currency !== 'USD' || (Number.isFinite(total) && total < expectedAmount)) {
    console.error('[Dodo] AMOUNT/CURRENCY MISMATCH - Pro NOT granted', { orderRef, paymentId, total, expectedAmount, currency });
    return 'mismatch';
  }

  const periodEnd: string | null = sub?.next_billing_date ? new Date(sub.next_billing_date).toISOString() : null;

  const { data: result, error } = await adminDb.rpc('fulfill_payment', {
    p_provider: 'dodo',
    p_order_ref: orderRef,
    p_provider_order_id: paymentId,
    p_user_id: userId,
    p_billing_cycle: cycle,
    p_paid_amount: expectedAmount,
    p_currency: 'USD',
    p_period_end: periodEnd,
    p_subscription_id: subscriptionId,
    p_customer_id: payment?.customer?.customer_id ?? sub?.customer?.customer_id ?? null,
  });
  if (error) throw new Error(`fulfill_payment failed: ${error.message}`);

  if (result === 'mismatch') {
    console.error('[Dodo] fulfill_payment refused the payment', { orderRef, paymentId });
  }
  if (result === 'not_found') {
    throw new Error(`fulfill_payment: order not found for ${orderRef}`);
  }
  return String(result);
}

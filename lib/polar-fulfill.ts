/* eslint-disable @typescript-eslint/no-explicit-any */
import type { createAdminClient } from '@/utils/supabase/admin';
import { cycleFromPolarProductId, getPolarClient } from '@/lib/polar';

type AdminDb = ReturnType<typeof createAdminClient>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Our user ID, taken from the Polar customer (external_id) or checkout metadata. */
export function resolvePolarUserId(data: {
  customer?: { external_id?: string | null } | null;
  metadata?: Record<string, unknown> | null;
}): string | null {
  const fromCustomer = data.customer?.external_id;
  if (fromCustomer && UUID_RE.test(fromCustomer)) return fromCustomer;
  const fromMeta = data.metadata?.user_id;
  if (typeof fromMeta === 'string' && UUID_RE.test(fromMeta)) return fromMeta;
  return null;
}

/**
 * Grant or extend Pro for a paid Polar order.
 * Used by the webhook AND by the return page, so Pro is activated even if the webhook is late.
 * Safe to call many times: the database function only fulfils an order once.
 * Returns: fulfilled | duplicate | mismatch | not_found | ignored: ...
 */
export async function fulfillPolarOrder(adminDb: AdminDb, order: any): Promise<string> {
  const cycle = cycleFromPolarProductId(order.product_id ?? order.product?.id);
  if (!cycle) return 'ignored: not a TheCore product';

  const userId = resolvePolarUserId(order);
  if (!userId) {
    console.error('[Polar] paid order without a resolvable user', order.id);
    return 'ignored: no user';
  }

  let orderRef: string | null = typeof order.metadata?.order_ref === 'string' ? order.metadata.order_ref : null;
  if (!orderRef && order.checkout_id) {
    const { data } = await adminDb
      .from('orders')
      .select('cf_order_id')
      .eq('provider', 'polar')
      .eq('provider_checkout_id', order.checkout_id)
      .maybeSingle();
    orderRef = data?.cf_order_id ?? null;
  }
  // Renewal (no checkout of ours): a fixed reference keeps retries safe.
  if (!orderRef) orderRef = `core_renew_${order.id}`;

  let periodEnd: string | null = null;
  const subscriptionId: string | null = order.subscription_id ?? order.subscription?.id ?? null;
  if (subscriptionId) {
    try {
      const sub = await getPolarClient().subscriptions.get(subscriptionId);
      periodEnd = sub.current_period_end ? new Date(sub.current_period_end as unknown as string).toISOString() : null;
    } catch (err) {
      console.warn('[Polar] could not load subscription', subscriptionId, (err as Error)?.message);
    }
  }

  // Price before discount and tax. Discount codes are disabled at checkout.
  const paidAmount: number = order.subtotal_amount ?? order.net_amount ?? order.amount;
  const { data: result, error } = await adminDb.rpc('fulfill_payment', {
    p_provider: 'polar',
    p_order_ref: orderRef,
    p_provider_order_id: order.id,
    p_user_id: userId,
    p_billing_cycle: cycle,
    p_paid_amount: paidAmount,
    p_currency: String(order.currency || '').toUpperCase(),
    p_period_end: periodEnd,
    p_subscription_id: subscriptionId,
    p_customer_id: order.customer_id ?? order.customer?.id ?? null,
  });
  if (error) throw new Error(`fulfill_payment failed: ${error.message}`);

  if (result === 'mismatch') {
    console.error('[Polar] AMOUNT MISMATCH - Pro NOT granted', {
      orderRef,
      polarOrderId: order.id,
      paidAmount,
      currency: order.currency,
    });
  }
  if (result === 'not_found') {
    throw new Error(`fulfill_payment: order not found for ${orderRef}`);
  }
  return String(result);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, hasServiceRoleKey } from '@/utils/supabase/admin';
import {
  parsePolarWebhook,
  polarWebhooks,
  cycleFromPolarProductId,
  getPolarClient,
  revokePolarSubscription,
} from '@/lib/polar';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type AdminDb = ReturnType<typeof createAdminClient>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve our user ID from the Polar customer (external_id is set to our user ID at checkout). */
function resolveUserId(data: {
  customer?: { external_id?: string | null } | null;
  metadata?: Record<string, unknown> | null;
}): string | null {
  const fromCustomer = data.customer?.external_id;
  if (fromCustomer && UUID_RE.test(fromCustomer)) return fromCustomer;
  const fromMeta = data.metadata?.user_id;
  if (typeof fromMeta === 'string' && UUID_RE.test(fromMeta)) return fromMeta;
  return null;
}

async function handleOrderPaid(adminDb: AdminDb, order: any): Promise<string> {
  const cycle = cycleFromPolarProductId(order.product_id ?? order.product?.id);
  if (!cycle) return 'ignored: not a TheCore product';

  const userId = resolveUserId(order);
  if (!userId) {
    console.error('[Polar webhook] order.paid without a resolvable user', order.id);
    return 'ignored: no user';
  }

  // First purchase: we created the order row at checkout and passed its reference in metadata.
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
  // Renewal (no checkout of ours): a deterministic reference keeps retries idempotent.
  if (!orderRef) orderRef = `core_renew_${order.id}`;

  // End of the period just paid for (authoritative, from the subscription).
  let periodEnd: string | null = null;
  const subscriptionId: string | null = order.subscription_id ?? order.subscription?.id ?? null;
  if (subscriptionId) {
    try {
      const sub = await getPolarClient().subscriptions.get(subscriptionId);
      periodEnd = sub.current_period_end ? new Date(sub.current_period_end as unknown as string).toISOString() : null;
    } catch (err) {
      console.warn('[Polar webhook] could not load subscription', subscriptionId, (err as Error)?.message);
    }
  }

  const paidAmount: number = order.net_amount ?? order.subtotal_amount ?? order.amount;
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
    console.error('[Polar webhook] AMOUNT MISMATCH - Pro NOT granted', { orderRef, polarOrderId: order.id, paidAmount });
  }
  if (result === 'not_found') {
    throw new Error(`fulfill_payment: order not found for ${orderRef}`);
  }
  return String(result);
}

async function handleOrderRefunded(adminDb: AdminDb, order: any): Promise<string> {
  const cycle = cycleFromPolarProductId(order.product_id ?? order.product?.id);
  if (!cycle) return 'ignored: not a TheCore product';

  const isFull = order.status === 'refunded';
  const { data: result, error } = await adminDb.rpc('refund_payment', {
    p_provider: 'polar',
    p_order_ref: typeof order.metadata?.order_ref === 'string' ? order.metadata.order_ref : null,
    p_provider_order_id: order.id,
    p_refunded_total: Number(order.refunded_amount ?? 0),
    p_is_full: isFull,
  });
  if (error) throw new Error(`refund_payment failed: ${error.message}`);

  // Full refund: also stop the subscription so the customer is not charged again.
  const subscriptionId: string | null = order.subscription_id ?? order.subscription?.id ?? null;
  if (result === 'revoked' && subscriptionId) {
    await revokePolarSubscription(subscriptionId);
  }
  return String(result);
}

async function handleSubscription(adminDb: AdminDb, type: string, sub: any): Promise<string> {
  const cycle = cycleFromPolarProductId(sub.product_id ?? sub.product?.id);
  if (!cycle) return 'ignored: not a TheCore product';

  const userId = resolveUserId(sub);
  if (!userId) return 'ignored: no user';

  const revoke = type === 'subscription.revoked';
  const { data: result, error } = await adminDb.rpc('apply_polar_subscription_state', {
    p_user_id: userId,
    p_subscription_id: sub.id,
    p_status: String(sub.status ?? type.replace('subscription.', '')),
    p_cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    p_event_at: new Date(sub.modified_at ?? sub.canceled_at ?? Date.now()).toISOString(),
    p_revoke: revoke,
  });
  if (error) throw new Error(`apply_polar_subscription_state failed: ${error.message}`);
  return String(result);
}

export async function POST(req: NextRequest) {
  if (!hasServiceRoleKey()) {
    console.error('[Polar webhook] SUPABASE_SERVICE_ROLE_KEY is not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // 1. Verify the signature using the RAW body.
  const rawBody = await req.text();
  let event: Awaited<ReturnType<typeof parsePolarWebhook>>;
  try {
    event = await parsePolarWebhook(rawBody, req.headers);
  } catch (err) {
    if (err instanceof polarWebhooks.PolarWebhookVerificationError) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
    if (err instanceof polarWebhooks.PolarWebhookUnknownTypeError) {
      return NextResponse.json({ received: true, ignored: 'unknown event type' }, { status: 200 });
    }
    if (err instanceof polarWebhooks.PolarWebhookError) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    console.error('[Polar webhook] verification error:', (err as Error)?.message);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 500 });
  }

  const adminDb = createAdminClient();
  const webhookId = req.headers.get('webhook-id') || '';
  const data = event.data as any;

  try {
    // 2. Idempotency: one row per webhook-id. Already processed -> acknowledge and stop.
    const { error: insertError } = await adminDb.from('polar_webhook_events').insert({
      webhook_id: webhookId,
      event_type: event.type,
      payload: { type: event.type, id: data?.id, product_id: data?.product_id, status: data?.status },
    });
    if (insertError) {
      if (insertError.code === '23505') {
        const { data: existing } = await adminDb
          .from('polar_webhook_events')
          .select('processed_at')
          .eq('webhook_id', webhookId)
          .maybeSingle();
        if (existing?.processed_at) {
          return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
        }
        // Earlier attempt failed before finishing: process again (handlers are idempotent).
      } else {
        throw new Error(`could not record webhook: ${insertError.message}`);
      }
    }

    // 3. Act only on events for our own products; everything else is ignored.
    let outcome = 'ignored';
    switch (event.type) {
      case 'order.paid':
        outcome = await handleOrderPaid(adminDb, data);
        break;
      case 'order.refunded':
        outcome = await handleOrderRefunded(adminDb, data);
        break;
      case 'subscription.active':
      case 'subscription.canceled':
      case 'subscription.uncanceled':
      case 'subscription.past_due':
      case 'subscription.revoked':
      case 'subscription.updated':
        outcome = await handleSubscription(adminDb, event.type, data);
        break;
      default:
        outcome = 'ignored: unhandled event';
    }

    await adminDb
      .from('polar_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('webhook_id', webhookId);

    console.log(`[Polar webhook] ${event.type} -> ${outcome}`);
    return NextResponse.json({ received: true, outcome }, { status: 200 });
  } catch (err) {
    console.error('[Polar webhook] processing error:', (err as Error)?.message);
    // 500 makes Polar retry later.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

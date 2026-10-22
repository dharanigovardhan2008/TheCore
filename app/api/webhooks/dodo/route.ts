/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, hasServiceRoleKey } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  parseDodoWebhook,
  DodoWebhookVerificationError,
  cycleFromDodoProductId,
  cancelDodoSubscriptionNow,
} from '@/lib/dodo';
import { fulfillDodoPayment, resolveDodoUserId } from '@/lib/dodo-fulfill';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type AdminDb = ReturnType<typeof createAdminClient>;

async function handleRefund(adminDb: AdminDb, refund: any): Promise<string> {
  const paymentId: string | undefined = refund?.payment_id;
  if (!paymentId) return 'ignored: no payment id';

  // Only orders we fulfilled are known to us (their provider_order_id is the Dodo payment ID).
  const { data: order } = await adminDb
    .from('orders')
    .select('id, provider_subscription_id')
    .eq('provider', 'dodo')
    .eq('provider_order_id', paymentId)
    .maybeSingle();
  if (!order) return 'ignored: unknown payment';

  const { data: result, error } = await adminDb.rpc('refund_payment', {
    p_provider: 'dodo',
    p_order_ref: null,
    p_provider_order_id: paymentId,
    p_refunded_total: Number(refund?.amount ?? 0),
    p_is_full: refund?.is_partial === false,
  });
  if (error) throw new Error(`refund_payment failed: ${error.message}`);

  // Full refund: also stop the subscription so the customer is not charged again.
  if (result === 'revoked' && order.provider_subscription_id) {
    await cancelDodoSubscriptionNow(order.provider_subscription_id);
  }
  return String(result);
}

async function handleSubscription(adminDb: AdminDb, type: string, sub: any, eventAt: string): Promise<string> {
  const cycle = cycleFromDodoProductId(sub?.product_id);
  if (!cycle) return 'ignored: not a TheCore product';

  const subscriptionId: string | undefined = sub?.subscription_id;
  if (!subscriptionId) return 'ignored: no subscription id';

  const userId = await resolveDodoUserId(adminDb, [sub?.metadata], subscriptionId);
  if (!userId) return 'ignored: no user';

  // Paid time is never cut short by these events: Pro simply ends at plan_expires_at if it is not renewed.
  const endsAtPeriodEnd = Boolean(sub?.cancel_at_next_billing_date) || ['subscription.cancelled', 'subscription.expired'].includes(type);
  const { data: result, error } = await adminDb.rpc('apply_polar_subscription_state', {
    p_user_id: userId,
    p_subscription_id: subscriptionId,
    p_status: String(sub?.status ?? type.replace('subscription.', '')),
    p_cancel_at_period_end: endsAtPeriodEnd,
    p_event_at: eventAt,
    p_revoke: false,
  });
  if (error) throw new Error(`apply_polar_subscription_state failed: ${error.message}`);
  return String(result);
}

export async function POST(req: NextRequest) {
  if (!hasServiceRoleKey()) {
    console.error('[Dodo webhook] SUPABASE_SERVICE_ROLE_KEY is not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // 1. Verify the signature using the RAW body.
  const rawBody = await req.text();
  let event: { type: string; timestamp?: string; data: any };
  try {
    event = parseDodoWebhook(rawBody, req.headers);
  } catch (err) {
    if (err instanceof DodoWebhookVerificationError) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
    console.error('[Dodo webhook] verification error:', (err as Error)?.message);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 500 });
  }

  const adminDb = createAdminClient();
  const webhookId = req.headers.get('webhook-id') || '';
  const data = event.data;

  try {
    // 2. Idempotency: one row per webhook-id (the table is shared with earlier providers).
    const { error: insertError } = await adminDb.from('polar_webhook_events').insert({
      webhook_id: webhookId,
      event_type: event.type,
      payload: { type: event.type, payment_id: data?.payment_id, subscription_id: data?.subscription_id, status: data?.status },
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
    const eventAt = new Date(event.timestamp ?? Date.now()).toISOString();
    switch (event.type) {
      case 'payment.succeeded':
        outcome = await fulfillDodoPayment(adminDb, data);
        break;
      case 'refund.succeeded':
        outcome = await handleRefund(adminDb, data);
        break;
      case 'subscription.active':
      case 'subscription.renewed':
      case 'subscription.updated':
      case 'subscription.plan_changed':
      case 'subscription.past_due':
      case 'subscription.on_hold':
      case 'subscription.failed':
      case 'subscription.cancelled':
      case 'subscription.expired':
        outcome = await handleSubscription(adminDb, event.type, data, eventAt);
        break;
      case 'payment.failed':
        console.warn('[Dodo webhook] payment failed', data?.payment_id, data?.error_code);
        outcome = 'logged';
        break;
      default:
        outcome = 'ignored: unhandled event';
    }

    await adminDb
      .from('polar_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('webhook_id', webhookId);

    revalidatePath('/dashboard', 'layout');
    console.log(`[Dodo webhook] ${event.type} -> ${outcome}`);
    return NextResponse.json({ received: true, outcome }, { status: 200 });
  } catch (err) {
    console.error('[Dodo webhook] processing error:', (err as Error)?.message);
    // 500 makes Dodo retry later.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

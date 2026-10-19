/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, hasServiceRoleKey } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  parsePolarWebhook,
  polarWebhooks,
  cycleFromPolarProductId,
  revokePolarSubscription,
} from '@/lib/polar';
import { fulfillPolarOrder, resolvePolarUserId } from '@/lib/polar-fulfill';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type AdminDb = ReturnType<typeof createAdminClient>;

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

  const userId = resolvePolarUserId(sub);
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
        outcome = await fulfillPolarOrder(adminDb, data);
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

    revalidatePath('/dashboard', 'layout');
    console.log(`[Polar webhook] ${event.type} -> ${outcome}`);
    return NextResponse.json({ received: true, outcome }, { status: 200 });
  } catch (err) {
    console.error('[Polar webhook] processing error:', (err as Error)?.message);
    // 500 makes Polar retry later.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

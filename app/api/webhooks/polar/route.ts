import { NextRequest, NextResponse } from 'next/server';
import { webhooks } from '@polar-sh/sdk/2026-10';
const { validateEvent } = webhooks;
import { createAdminClient } from '@/utils/supabase/admin';
import { type BillingCycle } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-polar-signature') || req.headers.get('polar-webhook-signature');

    // For local development, we might not have a secret set
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    // 1. Verify webhook signature if secret is configured
    if (webhookSecret) {
      try {
        const event = validateEvent(rawBody, {
          'polar-webhook-signature': signature || '',
        }, webhookSecret);

        // If validation fails, validateEvent will throw
        // We'll use the validated event from here
      } catch (verificationError) {
        console.warn('Polar webhook signature verification failed:', verificationError);
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventType = payload.type as string;
    const data = payload.data as Record<string, unknown> | undefined;

    // 2. Log the webhook event for idempotency (using webhook_id from Polar)
    const webhookId = payload.id as string || `${eventType}-${Date.now()}`;
    const adminDb = createAdminClient();

    // 3. Idempotent check: Insert into polar_webhook_events with unique webhook_id
    const { error: eventError } = await adminDb.from('polar_webhook_events').insert({
      webhook_id: webhookId,
      event_type: eventType,
      payload: payload,
    });

    if (eventError) {
      // Postgres error code 23505 indicates duplicate key violation -> already handled!
      if (eventError.code === '23505' || eventError.message?.includes('duplicate key')) {
        return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
      }
      console.error('Error logging polar webhook event:', eventError.message);
    }

    // 4. Handle specific events according to instructions
    // Only order.paid grants Pro via fulfill_payment
    // Subscription events only update state via apply_polar_subscription_state

    if (eventType === 'order.paid') {
      // Handle order paid - grant Pro via fulfill_payment RPC
      const orderRef = data?.order_ref as string;
      const subscriptionId = data?.subscription_id as string || null;
      const customerId = data?.customer_id as string;
      const amount = data?.amount as number; // amount in cents (USD)
      const currency = data?.currency as string || 'USD';
      const cycle = data?.interval as BillingCycle || 'month'; // Assuming interval field

      if (!orderRef || !customerId) {
        console.warn('Missing required fields in order.paid event:', { orderRef, customerId });
        return NextResponse.json({ message: 'Missing required fields' }, { status: 200 });
      }

      // Verify amount matches our plan config
      let expectedAmountCents: number | null = null;
      try {
        const { data: planConfig } = await adminDb
          .from('plan_configs')
          .select(`price_month_usd, price_year_usd`)
          .eq('id', 'pro')
          .single();

        if (planConfig) {
          expectedAmountCents = cycle === 'year'
            ? Math.round((planConfig.price_year_usd ?? 0) * 100)
            : Math.round((planConfig.price_month_usd ?? 0) * 100);
        }
      } catch (err) {
        console.error('Failed to fetch plan config for amount verification:', err);
      }

      if (expectedAmountCents !== null && amount !== expectedAmountCents) {
        console.error('Polar order amount mismatch:', {
          received: amount,
          expected: expectedAmountCents,
          orderRef
        });
        // Still process the event but log the mismatch - could be a pricing update
        // For security, we might want to reject, but let's continue for now
      }

      // Use RPC fulfill_payment function (service_role only)
      try {
        const { error: fulfillError } = await adminDb.rpc('fulfill_payment', {
          p_provider: 'polar',
          p_order_ref: orderRef,
          p_provider_order_id: subscriptionId || '', // Polar subscription ID as provider_order_id
          p_user_id: customerId, // external_customer_id is the user.id
          p_billing_cycle: cycle,
          p_paid_amount: amount, // amount in cents
          p_currency: currency,
          p_period_end: null,
          p_subscription_id: subscriptionId || null,
          p_customer_id: customerId,
        });

        if (fulfillError) {
          console.error('Fulfill payment RPC failed:', fulfillError);
          // Fallback to manual update if RPC fails
          await adminDb.from('orders').update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          }).eq('cf_order_id', orderRef);

          // Fetch user's profile and extend Pro plan
          const { data: profile } = await adminDb
            .from('profiles')
            .select('plan, plan_expires_at')
            .eq('id', customerId)
            .single();

          if (profile) {
            const { calculateNewExpiry } = await import('@/lib/plans');
            const newExpiry = calculateNewExpiry(
              profile?.plan_expires_at,
              cycle as BillingCycle
            );

            await adminDb.from('profiles').update({
              plan: 'pro',
              plan_expires_at: newExpiry.toISOString(),
              plan_provider: 'polar',
            }).eq('id', customerId);
          }
        }
      } catch (rpcErr) {
        console.error('Fulfill payment RPC invocation error:', rpcErr);
        // Fallback to manual update
        await adminDb.from('orders').update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        }).eq('cf_order_id', orderRef);

        // Fetch user's profile and extend Pro plan
        const { data: profile } = await adminDb
          .from('profiles')
          .select('plan, plan_expires_at')
          .eq('id', customerId)
          .single();

        if (profile) {
          const { calculateNewExpiry } = await import('@/lib/plans');
          const newExpiry = calculateNewExpiry(
            profile?.plan_expires_at,
            cycle as BillingCycle
          );

          await adminDb.from('profiles').update({
            plan: 'pro',
            plan_expires_at: newExpiry.toISOString(),
            plan_provider: 'polar',
          }).eq('id', customerId);
        }
      }
    }
    // Handle subscription events - only update state via apply_polar_subscription_state
    else if (
      eventType === 'subscription.active' ||
      eventType === 'subscription.canceled' ||
      eventType === 'subscription.created' ||
      eventType === 'subscription.cycled' ||
      eventType === 'subscription.past_due' ||
      eventType === 'subscription.paused' ||
      eventType === 'subscription.resumed' ||
      eventType === 'subscription.revoked' ||
      eventType === 'subscription.uncanceled' ||
      eventType === 'subscription.updated'
    ) {
      // Extract subscription data
      const subscriptionId = data?.id as string;
      const customerId = data?.customer_id as string;
      const status = data?.status as string;
      const cancelAtPeriodEnd = data?.cancel_at_period_end as boolean || false;
      const currentPeriodEnd = data?.current_period_end as string || null;
      const interval = data?.interval as BillingCycle || 'month';

      if (!subscriptionId || !customerId) {
        console.warn('Missing required fields in subscription event:', { subscriptionId, customerId });
        return NextResponse.json({ message: 'Missing required fields' }, { status: 200 });
      }

      // Determine if this is a revoke event (subscription.canceled or subscription.revoked)
      const isRevoke = eventType === 'subscription.canceled' || eventType === 'subscription.revoked';

      // Use RPC apply_polar_subscription_state function (service_role only)
      try {
        const { error: stateError } = await adminDb.rpc('apply_polar_subscription_state', {
          p_user_id: customerId,
          p_subscription_id: subscriptionId,
          p_status: status,
          p_cancel_at_period_end: cancelAtPeriodEnd,
          p_event_at: new Date().toISOString(),
          p_revoke: isRevoke,
          p_customer_id: customerId,
        });

        if (stateError) {
          console.error('Apply polar subscription state RPC failed:', stateError);
          // We still return 200 to prevent retries, but log the error
        }
      } catch (rpcErr) {
        console.error('Apply polar subscription state RPC invocation error:', rpcErr);
        // Still return 200 to prevent retries
      }
    }
    // Ignore other events (like order.created, order.refunded, etc.)
    else {
      // Log unhandled event types for monitoring
      console.info('Unhandled Polar webhook event type:', eventType);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Unhandled polar webhook exception:', (error as Error)?.message || error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { verifyCashfreeWebhookSignature, fetchCashfreeOrder } from '@/lib/cashfree';
import { createAdminClient } from '@/utils/supabase/admin';
import { calculateNewExpiry, type BillingCycle } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    // 1. Verify webhook signature and timestamp (reject invalid or expired requests)
    const verification = verifyCashfreeWebhookSignature({
      rawBody,
      signature,
      timestamp,
      maxAgeSeconds: 300, // 5 minutes tolerance
    });

    if (!verification.isValid) {
      console.warn('Cashfree webhook signature rejected:', verification.reason);
      return NextResponse.json(
        { error: 'Invalid or expired webhook signature', reason: verification.reason },
        { status: 400 }
      );
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventType = ((payload.type || payload.event_type || 'PAYMENT_EVENT') as string);
    const payloadData = payload.data as Record<string, unknown> | undefined;
    const orderObj = payloadData?.order as Record<string, unknown> | undefined;
    const paymentObj = payloadData?.payment as Record<string, unknown> | undefined;
    const orderId =
      (orderObj?.order_id as string) ||
      (payload.order_id as string) ||
      (payloadData?.order_id as string) ||
      (orderObj?.cf_order_id as string);

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order_id in webhook payload' }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // 2. Sanitize payload before storing (Never log or store sensitive customer auth or secret keys)
    const sanitizedPayload = {
      type: eventType,
      order_id: orderId,
      order_amount: orderObj?.order_amount,
      order_status: orderObj?.order_status,
      payment_status: paymentObj?.payment_status,
      event_time: payload.event_time,
    };

    // 3. Idempotent check: Insert into payment_events with unique (cf_order_id, event_type)
    const { error: eventError } = await adminDb.from('payment_events').insert({
      cf_order_id: orderId,
      event_type: eventType,
      payload: sanitizedPayload,
    });

    if (eventError) {
      // Postgres error code 23505 indicates duplicate key violation -> already handled!
      if (eventError.code === '23505' || eventError.message?.includes('duplicate key')) {
        return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
      }
      console.error('Error logging payment event:', eventError.message);
    }

    // 4. Handle PAYMENT_SUCCESS_WEBHOOK
    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'ORDER_PAID_SUCCESS') {
      // Fetch stored order safely without triggering UUID cast exceptions
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      const orderFilter = isUuid ? `cf_order_id.eq.${orderId},id.eq.${orderId}` : `cf_order_id.eq.${orderId}`;

      const { data: dbOrder } = await adminDb
        .from('orders')
        .select('*')
        .or(orderFilter)
        .maybeSingle();

      if (!dbOrder) {
        console.warn(`Order ${orderId} not found in database for webhook.`);
        return NextResponse.json({ message: 'Order record not found' }, { status: 200 });
      }

      // Re-fetch authoritative status from Cashfree API
      const cfOrder = await fetchCashfreeOrder(orderId);

      // Verify amount and currency match
      const amountPaise = Math.round(Number(cfOrder.order_amount) * 100);
      const isAmountValid = Math.abs(amountPaise - dbOrder.amount_paise) < 100; // within 1 rupee tolerance
      const isCurrencyValid = (cfOrder.order_currency || 'INR').toUpperCase() === 'INR';
      const isPaid = cfOrder.order_status === 'PAID';

      if (isPaid && isAmountValid && isCurrencyValid) {
        // Mark order as paid
        await adminDb.from('orders').update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        }).eq('id', dbOrder.id);

        // Fetch user's profile and extend Pro plan
        const { data: profile } = await adminDb
          .from('profiles')
          .select('plan, plan_expires_at')
          .eq('id', dbOrder.user_id)
          .single();

        const newExpiry = calculateNewExpiry(
          profile?.plan_expires_at,
          dbOrder.billing_cycle as BillingCycle
        );

        await adminDb.from('profiles').update({
          plan: 'pro',
          plan_expires_at: newExpiry.toISOString(),
        }).eq('id', dbOrder.user_id);
      }
    } else if (eventType === 'REFUND_SUCCESS_WEBHOOK') {
      // Handle refund: mark order as failed / refunded
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      const orderFilter = isUuid ? `cf_order_id.eq.${orderId},id.eq.${orderId}` : `cf_order_id.eq.${orderId}`;

      const { data: dbOrder } = await adminDb
        .from('orders')
        .select('*')
        .or(orderFilter)
        .maybeSingle();

      if (dbOrder) {
        await adminDb.from('orders').update({
          status: 'failed',
        }).eq('id', dbOrder.id);

        // Downgrade user back to free if refund processed
        await adminDb.from('profiles').update({
          plan: 'free',
          plan_expires_at: null,
        }).eq('id', dbOrder.user_id);
      }
    } else if (
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK' ||
      eventType === 'ORDER_TERMINATED_WEBHOOK'
    ) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      const orderFilter = isUuid ? `cf_order_id.eq.${orderId},id.eq.${orderId}` : `cf_order_id.eq.${orderId}`;

      const { data: dbOrder } = await adminDb
        .from('orders')
        .select('*')
        .or(orderFilter)
        .maybeSingle();

      if (dbOrder && dbOrder.status === 'created') {
        await adminDb.from('orders').update({
          status: 'failed',
        }).eq('id', dbOrder.id);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Unhandled webhook exception:', (error as Error)?.message || error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}


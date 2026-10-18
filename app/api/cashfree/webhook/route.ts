/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyCashfreeWebhookSignature, fetchCashfreeOrder, fetchCashfreeRefunds } from '@/lib/cashfree';
import { createAdminClient, hasServiceRoleKey } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cashfree (India, INR) webhook.
 * Shared Cashfree account: every product passes its own notify_url and uses its own order prefix,
 * so this route only acts on orders that exist in THIS app's database.
 */
export async function POST(req: NextRequest) {
  if (!hasServiceRoleKey()) {
    console.error('[Cashfree webhook] SUPABASE_SERVICE_ROLE_KEY is not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    // 1. Signature over the RAW body + timestamp freshness.
    const rawBody = await req.text();
    const verification = verifyCashfreeWebhookSignature({
      rawBody,
      signature: req.headers.get('x-webhook-signature'),
      timestamp: req.headers.get('x-webhook-timestamp'),
      maxAgeSeconds: 300,
    });
    if (!verification.isValid) {
      console.warn('[Cashfree webhook] signature rejected:', verification.reason);
      return NextResponse.json({ error: 'Invalid or expired webhook signature' }, { status: 400 });
    }

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventType: string = payload.type || payload.event_type || 'UNKNOWN';
    const data = payload.data as Record<string, any> | undefined;
    const orderId: string | undefined =
      data?.order?.order_id || data?.refund?.order_id || data?.order_id || payload.order_id;
    if (!orderId) {
      return NextResponse.json({ error: 'Missing order_id in webhook payload' }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // 2. Audit log only (never a gate): duplicates are ignored, processing below is idempotent.
    await adminDb.from('payment_events').upsert(
      {
        cf_order_id: orderId,
        event_type: eventType,
        payload: {
          type: eventType,
          order_id: orderId,
          order_amount: data?.order?.order_amount,
          order_status: data?.order?.order_status,
          payment_status: data?.payment?.payment_status,
          refund_status: data?.refund?.refund_status,
          event_time: payload.event_time,
        },
      },
      { onConflict: 'cf_order_id,event_type', ignoreDuplicates: true }
    );

    // 3. Only our own orders (a shared account also delivers other products' events).
    const { data: dbOrder } = await adminDb
      .from('orders')
      .select('id, user_id, status, billing_cycle, amount_paise, currency, cf_order_id')
      .eq('provider', 'cashfree')
      .eq('cf_order_id', orderId)
      .maybeSingle();
    if (!dbOrder) {
      return NextResponse.json({ message: 'Order not found in this app' }, { status: 200 });
    }

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'ORDER_PAID_SUCCESS') {
      // Never trust the webhook body: confirm the final status with Cashfree.
      const cfOrder = await fetchCashfreeOrder(orderId);
      if (cfOrder.order_status !== 'PAID') {
        return NextResponse.json({ message: 'Order not paid yet' }, { status: 200 });
      }
      const { data: result, error } = await adminDb.rpc('fulfill_payment', {
        p_provider: 'cashfree',
        p_order_ref: dbOrder.cf_order_id,
        p_provider_order_id: null,
        p_user_id: dbOrder.user_id,
        p_billing_cycle: dbOrder.billing_cycle,
        p_paid_amount: Math.round(Number(cfOrder.order_amount) * 100),
        p_currency: String(cfOrder.order_currency || '').toUpperCase(),
      });
      if (error) throw new Error(`fulfill_payment failed: ${error.message}`);
      if (result === 'mismatch') {
        console.error('[Cashfree webhook] AMOUNT MISMATCH - Pro NOT granted', orderId);
      }
      console.log(`[Cashfree webhook] ${eventType} ${orderId} -> ${result}`);
    } else if (eventType === 'REFUND_STATUS_WEBHOOK' || eventType === 'REFUND_SUCCESS_WEBHOOK') {
      // One webhook = one refund. Use the authoritative TOTAL so a partial refund keeps Pro.
      const refunds = await fetchCashfreeRefunds(orderId);
      const refundedMinor = refunds
        .filter((r) => r.refund_status === 'SUCCESS')
        .reduce((sum, r) => sum + Math.round(Number(r.refund_amount) * 100), 0);
      if (refundedMinor > 0) {
        const { data: result, error } = await adminDb.rpc('refund_payment', {
          p_provider: 'cashfree',
          p_order_ref: dbOrder.cf_order_id,
          p_provider_order_id: null,
          p_refunded_total: refundedMinor,
          p_is_full: refundedMinor >= dbOrder.amount_paise,
        });
        if (error) throw new Error(`refund_payment failed: ${error.message}`);
        console.log(`[Cashfree webhook] ${eventType} ${orderId} -> ${result}`);
      }
    } else if (eventType === 'ORDER_TERMINATED_WEBHOOK') {
      // A failed attempt can be retried inside the same order, so only the terminal event closes it,
      // and only if it is still unpaid.
      await adminDb.from('orders').update({ status: 'failed' }).eq('id', dbOrder.id).eq('status', 'created');
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('[Cashfree webhook] processing error:', (error as Error)?.message || error);
    // 500 makes Cashfree retry.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

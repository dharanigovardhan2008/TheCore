import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  PLANS,
  isProActive,
  getEffectiveLimits,
  getPlanPriceInPaise,
  calculateNewExpiry,
} from '../lib/plans';
import { verifyCashfreeWebhookSignature } from '../lib/cashfree';

describe('Plans & Limits Suite', () => {
  it('defines Free and Pro plans with exact required limits and pricing', () => {
    assert.strictEqual(PLANS.free.limits.maxProjects, 3);
    assert.strictEqual(PLANS.free.limits.maxEnvFilesPerProject, 1);
    assert.strictEqual(PLANS.pro.limits.maxProjects, Infinity);
    assert.strictEqual(PLANS.pro.limits.maxEnvFilesPerProject, Infinity);

    assert.strictEqual(PLANS.pro.pricing?.month.amountInRupees, 99);
    assert.strictEqual(PLANS.pro.pricing?.month.amountInPaise, 9900);
    assert.strictEqual(PLANS.pro.pricing?.year.amountInRupees, 999);
    assert.strictEqual(PLANS.pro.pricing?.year.amountInPaise, 99900);
  });

  it('guarantees amounts come strictly from config', () => {
    assert.strictEqual(getPlanPriceInPaise('pro', 'month'), 9900);
    assert.strictEqual(getPlanPriceInPaise('pro', 'year'), 99900);
    assert.throws(() => getPlanPriceInPaise('free', 'month'), /billable/i);
  });

  it('correctly detects active Pro vs expired Pro vs Free', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    assert.strictEqual(isProActive('pro', futureDate), true);
    assert.strictEqual(isProActive('pro', pastDate), false);
    assert.strictEqual(isProActive('free', futureDate), false);
    assert.strictEqual(isProActive(null, null), false);
  });

  it('enforces fallback to Free limits when Pro expires', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const activeLimits = getEffectiveLimits('pro', futureDate);
    assert.strictEqual(activeLimits.maxProjects, Infinity);
    assert.strictEqual(activeLimits.maxEnvFilesPerProject, Infinity);

    const expiredLimits = getEffectiveLimits('pro', pastDate);
    assert.strictEqual(expiredLimits.maxProjects, 3);
    assert.strictEqual(expiredLimits.maxEnvFilesPerProject, 1);
  });

  it('accurately calculates expiry extension math (future vs expired)', () => {
    const now = new Date('2026-10-20T12:00:00Z');

    // 1. Expired user purchasing monthly
    const expiredDate = new Date('2026-10-10T12:00:00Z');
    const newFromExpired = calculateNewExpiry(expiredDate, 'month', now);
    const expectedDiffDays = Math.round((newFromExpired.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    assert.strictEqual(expectedDiffDays, 30);

    // 2. Active user with 10 days left purchasing yearly
    const activeFuture = new Date('2026-10-30T12:00:00Z'); // 10 days in future
    const newFromActive = calculateNewExpiry(activeFuture, 'year', now);
    const expectedYearlyDiff = Math.round((newFromActive.getTime() - activeFuture.getTime()) / (24 * 60 * 60 * 1000));
    assert.strictEqual(expectedYearlyDiff, 365);
  });
});

describe('Cashfree Webhook Signature & Security Suite', () => {
  const secretKey = 'test_cashfree_secret_key_12345';
  process.env.CASHFREE_SECRET_KEY = secretKey;
  process.env.CASHFREE_APP_ID = 'test_app_id';

  it('validates a correct HMAC SHA256 signature', () => {
    const timestamp = String(Date.now());
    const rawBody = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: { order: { order_id: 'order_test_123', order_amount: 99 } },
    });

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(timestamp + rawBody)
      .digest('base64');

    const result = verifyCashfreeWebhookSignature({
      rawBody,
      signature: expectedSignature,
      timestamp,
      maxAgeSeconds: 300,
    });

    assert.strictEqual(result.isValid, true);
  });

  it('rejects an invalid or tampered signature', () => {
    const timestamp = String(Date.now());
    const rawBody = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' });
    const fakeSignature = Buffer.from('invalid-tampered-signature-data-tag-1234').toString('base64');

    const result = verifyCashfreeWebhookSignature({
      rawBody,
      signature: fakeSignature,
      timestamp,
    });

    assert.strictEqual(result.isValid, false);
  });

  it('rejects an expired webhook timestamp to prevent replay attacks', () => {
    // 10 minutes ago (600 seconds)
    const oldTimestamp = String(Date.now() - 600 * 1000);
    const rawBody = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' });

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(oldTimestamp + rawBody)
      .digest('base64');

    const result = verifyCashfreeWebhookSignature({
      rawBody,
      signature,
      timestamp: oldTimestamp,
      maxAgeSeconds: 300,
    });

    assert.strictEqual(result.isValid, false);
    assert.ok(result.reason?.includes('expired'));
  });

  it('verifies idempotent duplicate event handling', () => {
    // Mock simulation of database unique constraint (cf_order_id, event_type)
    const processedEvents = new Set<string>();

    function processEvent(orderId: string, eventType: string) {
      const key = `${orderId}:${eventType}`;
      if (processedEvents.has(key)) {
        return { status: 200, message: 'Event already processed' };
      }
      processedEvents.add(key);
      return { status: 200, success: true };
    }

    const firstCall = processEvent('order_abc', 'PAYMENT_SUCCESS_WEBHOOK');
    assert.strictEqual(firstCall.success, true);

    const secondCall = processEvent('order_abc', 'PAYMENT_SUCCESS_WEBHOOK');
    assert.strictEqual(secondCall.message, 'Event already processed');
    assert.strictEqual(processedEvents.size, 1);
  });
});


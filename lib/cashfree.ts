import crypto from 'node:crypto';

export interface CreateOrderParams {
  orderId: string;
  amountInRupees: number;
  customerId: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  returnUrl: string;
  orderNote?: string;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_amount: number;
  order_currency: string;
  payment_session_id: string;
  order_status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'TERMINATED' | string;
  entity: string;
}

export interface CashfreeFetchOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'TERMINATED' | string;
  order_expiry_time?: string;
}

const CASHFREE_API_VERSION = '2023-08-01';

/**
 * Redact sensitive fields (secrets, keys, tokens, signatures) from log objects.
 */
function sanitizeForLogging(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data;
  if (Array.isArray(data)) return data.map(sanitizeForLogging);
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (/secret|token|password|auth|signature|key/i.test(key) && typeof val === 'string') {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeForLogging(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export function getCashfreeBaseUrl(): string {
  const env = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();
  return env === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

function getCredentials() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cashfree credentials (CASHFREE_APP_ID, CASHFREE_SECRET_KEY) are missing.');
    }
  }

  return {
    appId: appId || 'mock-cashfree-app-id',
    secretKey: secretKey || 'mock-cashfree-secret-key',
  };
}

/**
 * Create a new payment order via Cashfree PG API.
 * Server-only execution.
 */
export async function createCashfreeOrder(params: CreateOrderParams): Promise<CashfreeOrderResponse> {
  const { appId, secretKey } = getCredentials();
  const baseUrl = getCashfreeBaseUrl();

  // Cashfree requires a valid customer phone (10 digits). Default to standard valid test number if absent.
  const phone = params.customerPhone && /^\d{10}$/.test(params.customerPhone)
    ? params.customerPhone
    : '9876543210';

  const body = {
    order_id: params.orderId,
    order_amount: Number(params.amountInRupees.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: params.customerId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50),
      customer_name: params.customerName || 'Subscriber',
      customer_email: params.customerEmail,
      customer_phone: phone,
    },
    order_meta: {
      return_url: params.returnUrl,
    },
    order_note: params.orderNote || 'TheCore Subscription',
  };

  // If in dev and dummy credentials, return a mock response for seamless local testing
  if (appId === 'mock-cashfree-app-id') {
    return {
      cf_order_id: `cf_${Date.now()}`,
      order_id: params.orderId,
      order_amount: body.order_amount,
      order_currency: 'INR',
      payment_session_id: `session_mock_${Date.now()}`,
      order_status: 'ACTIVE',
      entity: 'order',
    };
  }

  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': CASHFREE_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const requestIdHeader = response.headers.get('x-request-id') || response.headers.get('cf-ray') || 'none';

  if (!response.ok) {
    const errorText = await response.text();
    let sanitizedError = errorText;
    try {
      sanitizedError = JSON.stringify(sanitizeForLogging(JSON.parse(errorText)));
    } catch {
      sanitizedError = errorText.replace(/(key|secret|token|pass)=\w+/gi, '$1=REDACTED');
    }
    console.error(
      `[Cashfree Create Order Failed] Order ID: ${params.orderId}, Status: ${response.status} ${response.statusText}, Request ID: ${requestIdHeader}, Error: ${sanitizedError}`
    );
    throw new Error(`Failed to create Cashfree order: ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as CashfreeOrderResponse;
  console.log(
    `[Cashfree Create Order Success] Order ID: ${params.orderId}, CF Order ID: ${result.cf_order_id}, Status: ${response.status}, Request ID: ${requestIdHeader}`
  );
  return result;
}

/**
 * Fetch authoritative order details from Cashfree by order ID.
 */
export async function fetchCashfreeOrder(orderId: string): Promise<CashfreeFetchOrderResponse> {
  const { appId, secretKey } = getCredentials();
  const baseUrl = getCashfreeBaseUrl();

  if (appId === 'mock-cashfree-app-id') {
    return {
      cf_order_id: `cf_${orderId}`,
      order_id: orderId,
      order_amount: 99,
      order_currency: 'INR',
      order_status: 'PAID',
    };
  }

  const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: {
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': CASHFREE_API_VERSION,
    },
  });

  const requestIdHeader = response.headers.get('x-request-id') || response.headers.get('cf-ray') || 'none';

  if (!response.ok) {
    const errorText = await response.text();
    let sanitizedError = errorText;
    try {
      sanitizedError = JSON.stringify(sanitizeForLogging(JSON.parse(errorText)));
    } catch {
      sanitizedError = errorText.replace(/(key|secret|token|pass)=\w+/gi, '$1=REDACTED');
    }
    console.error(
      `[Cashfree Fetch Order Failed] Order ID: ${orderId}, Status: ${response.status} ${response.statusText}, Request ID: ${requestIdHeader}, Error: ${sanitizedError}`
    );
    throw new Error(`Failed to fetch Cashfree order: ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as CashfreeFetchOrderResponse;
  console.log(
    `[Cashfree Fetch Order Success] Order ID: ${orderId}, Status: ${response.status}, Order Status: ${result.order_status}, Request ID: ${requestIdHeader}`
  );
  return result;
}

/**
 * Safely fetch authoritative order details from Cashfree, returning null if not found or on error.
 */
export async function safeFetchCashfreeOrder(orderId: string): Promise<CashfreeFetchOrderResponse | null> {
  try {
    return await fetchCashfreeOrder(orderId);
  } catch (err: unknown) {
    console.warn(`[Cashfree] Safe fetch order returned null for order ID ${orderId}:`, (err as Error)?.message);
    return null;
  }
}

/**
 * Verify Cashfree Webhook Signature.
 * Cashfree computes Base64(HMAC_SHA256(timestamp + rawBody, secretKey)).
 * Also validates timestamp within tolerance window (default 5 minutes).
 */
export function verifyCashfreeWebhookSignature({
  rawBody,
  signature,
  timestamp,
  maxAgeSeconds = 300,
}: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  maxAgeSeconds?: number;
}): { isValid: boolean; reason?: string } {
  if (!signature || !timestamp) {
    return { isValid: false, reason: 'Missing signature or timestamp headers' };
  }

  const { secretKey } = getCredentials();

  // Validate timestamp freshness (prevent replay attacks)
  const tsNum = Number(timestamp);
  if (isNaN(tsNum)) {
    return { isValid: false, reason: 'Invalid timestamp format' };
  }

  // Cashfree timestamp can be seconds or milliseconds
  const tsMillis = tsNum > 10000000000 ? tsNum : tsNum * 1000;
  const now = Date.now();
  const ageSeconds = Math.abs(now - tsMillis) / 1000;

  if (ageSeconds > maxAgeSeconds) {
    return { isValid: false, reason: `Timestamp expired (age: ${Math.round(ageSeconds)}s)` };
  }

  const dataToSign = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign)
    .digest('base64');

  try {
    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expectedBuf.length) {
      return { isValid: false, reason: 'Signature length mismatch' };
    }

    const matches = crypto.timingSafeEqual(sigBuf, expectedBuf);
    return { isValid: matches, reason: matches ? undefined : 'Signature mismatch' };
  } catch {
    return { isValid: false, reason: 'Verification error' };
  }
}


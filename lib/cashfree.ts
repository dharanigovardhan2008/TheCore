import crypto from 'node:crypto';

export interface CreateOrderParams {
  orderId: string;
  amountInRupees: number;
  customerId: string;
  customerEmail: string;
  customerName?: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
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
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();

  // Never fall back to mock or fake credentials, in any environment.
  if (!appId || !secretKey) {
    throw new Error('Cashfree credentials (CASHFREE_APP_ID, CASHFREE_SECRET_KEY) are missing.');
  }

  return { appId, secretKey };
}

/** True when the 10-digit Indian mobile number Cashfree requires is valid. */
export function isValidIndianMobile(phone?: string | null): phone is string {
  return typeof phone === 'string' && /^[6-9]\d{9}$/.test(phone);
}

/**
 * Create a new payment order via Cashfree PG API.
 * Server-only execution.
 */
export async function createCashfreeOrder(params: CreateOrderParams): Promise<CashfreeOrderResponse> {
  const { appId, secretKey } = getCredentials();
  const baseUrl = getCashfreeBaseUrl();

  if (!isValidIndianMobile(params.customerPhone)) {
    throw new Error('A valid 10-digit Indian mobile number is required for INR checkout.');
  }

  const body = {
    order_id: params.orderId,
    order_amount: Number(params.amountInRupees.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: params.customerId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50),
      customer_name: params.customerName || 'Subscriber',
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
    },
    order_meta: {
      return_url: params.returnUrl,
      // Per-order webhook URL so the event reaches THIS product (shared Cashfree account).
      notify_url: params.notifyUrl,
    },
    order_note: params.orderNote || 'TheCore Subscription',
  };

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


export interface CashfreeRefund {
  refund_id: string;
  refund_amount: number;
  refund_status: 'SUCCESS' | 'PENDING' | 'CANCELLED' | 'ONHOLD' | 'FAILED' | string;
}

/**
 * Authoritative list of refunds for an order. Used to compute the TOTAL refunded so far
 * (a refund webhook describes one refund; a partial refund must not remove Pro).
 */
export async function fetchCashfreeRefunds(orderId: string): Promise<CashfreeRefund[]> {
  const { appId, secretKey } = getCredentials();
  const response = await fetch(`${getCashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}/refunds`, {
    method: 'GET',
    headers: {
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': CASHFREE_API_VERSION,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Cashfree refunds: ${response.status} ${response.statusText}`);
  }
  const body = (await response.json()) as CashfreeRefund[] | { data?: CashfreeRefund[] };
  return Array.isArray(body) ? body : body.data ?? [];
}

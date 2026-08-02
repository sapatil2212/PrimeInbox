import crypto from "crypto";
import { log } from "@/lib/billing-logger";

// ─── Configuration ───────────────────────────────────────────────────────────

/**
 * Zoho Payments REST API base URL (India data center).
 * Server-side calls: POST /paymentsessions, GET /payments/{id}
 * Auth required: OAuth 2.0 (Zoho-oauthtoken header)
 */
const ZOHO_API_BASE = "https://payments.zoho.in/api/v1";

interface ZohoConfig {
  accountId: string;
  apiKey: string;
  signingKey: string;
}

/**
 * Reads and validates the three Zoho env vars needed for the checkout widget
 * and webhook verification. Throws at call time if any are missing.
 *
 * - ZOHO_ACCOUNT_ID  — identifies your payments account in every API call
 * - ZOHO_API_KEY     — used client-side to initialise the ZPayments widget
 * - ZOHO_SIGNING_KEY — used server-side to verify webhook HMAC signatures
 */
export function getZohoConfig(): ZohoConfig {
  const accountId = process.env.ZOHO_ACCOUNT_ID;
  const apiKey = process.env.ZOHO_API_KEY;
  const signingKey = process.env.ZOHO_SIGNING_KEY;

  if (!accountId || !apiKey || !signingKey) {
    const missing = [
      !accountId && "ZOHO_ACCOUNT_ID",
      !apiKey && "ZOHO_API_KEY",
      !signingKey && "ZOHO_SIGNING_KEY",
    ].filter(Boolean);
    throw new Error(
      `Zoho Payments is not configured. Missing env vars: ${missing.join(", ")}. ` +
        `Set them in your .env file to enable payments.`
    );
  }

  return { accountId, apiKey, signingKey };
}

/**
 * Returns true if the three widget/webhook env vars are present.
 * Use this for graceful degradation (e.g. disabling the checkout UI)
 * instead of hard crashes on page load.
 */
export function isZohoConfigured(): boolean {
  return !!(
    process.env.ZOHO_ACCOUNT_ID &&
    process.env.ZOHO_API_KEY &&
    process.env.ZOHO_SIGNING_KEY
  );
}

// ─── OAuth 2.0 Token Management ──────────────────────────────────────────────
//
// Zoho Payments REST API (server-side) requires OAuth 2.0.
// The API key from Developer Space is for the client-side widget ONLY.
//
// Required OAuth scopes:
//   ZohoPay.payments.CREATE  — POST /paymentsessions
//   ZohoPay.payments.READ    — GET  /payments/{id}
//
// How to obtain credentials:
//   1. Visit https://api-console.zoho.in/
//   2. Create a "Self Client" application
//   3. Under "Generate Code", add scopes:
//        ZohoPay.payments.CREATE,ZohoPay.payments.READ
//   4. Copy the Client ID and Client Secret
//   5. Exchange the grant code for tokens via POST to:
//        https://accounts.zoho.in/oauth/v2/token
//   6. Store ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN in .env

const ZOHO_TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token";

/** In-memory token cache. Refreshed automatically when expired. */
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Validates that OAuth credentials are present in environment.
 * Throws a descriptive error if any are missing, pointing the developer
 * to the exact setup steps needed.
 */
function assertOAuthCredentials(): void {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    const missing = [
      !clientId && "ZOHO_CLIENT_ID",
      !clientSecret && "ZOHO_CLIENT_SECRET",
      !refreshToken && "ZOHO_REFRESH_TOKEN",
    ].filter(Boolean);

    throw new Error(
      `Zoho Payments OAuth is not configured. Missing: ${missing.join(", ")}. ` +
        `Server-side API calls (create session, retrieve payment) require OAuth 2.0. ` +
        `Set up a Self Client at https://api-console.zoho.in/ with scopes ` +
        `"ZohoPay.payments.CREATE,ZohoPay.payments.READ", then add the credentials to .env.`
    );
  }
}

/**
 * Returns a valid Zoho OAuth access token, refreshing it when expired.
 *
 * Uses the refresh_token grant against accounts.zoho.in (India data center).
 * Caches the result in memory with a 60-second safety margin before expiry.
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s safety margin)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  // This will throw clearly if env vars are not set
  assertOAuthCredentials();

  const clientId = process.env.ZOHO_CLIENT_ID!;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET!;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN!;

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(ZOHO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Failed to refresh Zoho OAuth token: ${res.status} ${detail}. ` +
        `Check that ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN are correct.`
    );
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(
      `Zoho OAuth error: ${data.error}. ` +
        `Ensure your Self Client at https://api-console.zoho.in/ has the correct scopes ` +
        `and that the refresh token has not been revoked.`
    );
  }

  cachedAccessToken = data.access_token;
  // Zoho access tokens expire in 3600 seconds (1 hour)
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1_000;

  return cachedAccessToken!;
}

/**
 * Builds the Authorization header for Zoho Payments REST API calls.
 *
 * Uses OAuth 2.0 access token — the only authentication method accepted
 * for server-side calls per official Zoho Payments documentation.
 * The ZOHO_API_KEY is NOT used here; it is only for the client-side widget.
 */
async function getZohoHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    Authorization: `Zoho-oauthtoken ${token}`,
    "Content-Type": "application/json",
  };
}

// ─── Payment Session ──────────────────────────────────────────────────────────

export interface PaymentSessionMetadata {
  companyId: string;
  planId: string;
  [key: string]: string;
}

export interface PaymentSessionResult {
  paymentsSessionId: string;
  amount: number;
  currency: string;
}

/**
 * Creates a Zoho Payments session.
 *
 * Returns a `payments_session_id` that the frontend passes to the
 * ZPayments checkout widget to open the payment UI.
 *
 * Authentication: OAuth 2.0 (ZohoPay.payments.CREATE scope)
 * Endpoint: POST https://payments.zoho.in/api/v1/paymentsessions
 *
 * @param amount   Amount in the currency's base unit (e.g. rupees for INR)
 * @param currency ISO 4217 currency code (e.g. "INR")
 * @param metadata Key/value pairs attached to the session for later retrieval
 */
export async function createPaymentSession(
  amount: number,
  currency: string,
  metadata: PaymentSessionMetadata
): Promise<PaymentSessionResult> {
  const { accountId } = getZohoConfig();

  const url = `${ZOHO_API_BASE}/paymentsessions?account_id=${accountId}`;
  const currencyCode = (currency || "INR").toUpperCase();

  const metaDataArray = Object.entries(metadata).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  const body = {
    amount: Number(amount),
    currency: currencyCode,
    description: `PrimeInbox ${metadata.planId} Subscription`,
    meta_data: metaDataArray,
  };

  log.checkoutCreated(metadata.companyId, metadata.planId, "pending");

  const res = await fetch(url, {
    method: "POST",
    headers: await getZohoHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    log.paymentFailure(
      metadata.companyId,
      metadata.planId,
      `Session creation failed: ${res.status} ${detail}`
    );
    throw new Error(`Failed to create payment session: ${res.status}`);
  }

  const data = await res.json();

  // Zoho response shape: { code: 0, message: "success", payments_session: { payments_session_id: "..." } }
  const session = data.payments_session || data.payment_session || data;

  const paymentsSessionId =
    session.payments_session_id ||
    session.payment_session_id;

  if (!paymentsSessionId) {
    throw new Error(
      `Zoho did not return a payments_session_id. Full response: ${JSON.stringify(data)}`
    );
  }

  log.checkoutCreated(metadata.companyId, metadata.planId, paymentsSessionId);

  return {
    paymentsSessionId,
    amount: session.amount ?? amount,
    currency: session.currency ?? currency,
  };
}

// ─── Customer Management ──────────────────────────────────────────────────────

export interface ZohoCustomer {
  customerId: string;
  name: string;
  email: string;
}

/**
 * Creates or retrieves a Customer in Zoho Payments.
 * Required before initiating mandate enrollment.
 * Endpoint: POST https://payments.zoho.in/api/v1/customers
 */
export async function createZohoCustomer(
  name: string,
  email: string,
  phone?: string
): Promise<ZohoCustomer> {
  const { accountId } = getZohoConfig();
  const url = `${ZOHO_API_BASE}/customers?account_id=${accountId}`;

  const body: Record<string, unknown> = {
    name: name || "Subscriber",
    email,
  };

  if (phone) {
    body.phone = phone;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: await getZohoHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to create Zoho customer: ${res.status} ${detail}`);
  }

  const data = await res.json();
  const customer = data.customer || data;
  const customerId = customer.customer_id || data.customer_id;

  if (!customerId) {
    throw new Error(`Zoho did not return a customer_id. Response: ${JSON.stringify(data)}`);
  }

  return {
    customerId,
    name: customer.name || name,
    email: customer.email || email,
  };
}

// ─── Mandate Enrollment Session ───────────────────────────────────────────────

/**
 * Creates a Zoho Payments session for Mandate Enrollment.
 *
 * Displays all recurring payment options configured on your account
 * (Cards Standing Instructions, UPI AutoPay, Netbanking eNACH).
 *
 * Endpoint: POST https://payments.zoho.in/api/v1/paymentsessions
 */
export async function createMandateEnrollmentSession(
  customerId: string,
  amount: number,
  currency: string,
  metadata: PaymentSessionMetadata
): Promise<PaymentSessionResult> {
  const { accountId } = getZohoConfig();
  const url = `${ZOHO_API_BASE}/paymentsessions?account_id=${accountId}`;
  const currencyCode = (currency || "INR").toUpperCase();

  const metaDataArray = Object.entries(metadata).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  const body = {
    amount: Number(amount),
    mandate_amount: Number(amount),
    currency: currencyCode,
    customer_id: customerId,
    type: "mandate_enrollment",
    frequency: "MONTHLY",
    billing_cycle: "MONTHLY",
    description: `Auto-recurring monthly subscription for PrimeInbox ${metadata.planId} (₹${amount}/mo)`,
    meta_data: metaDataArray,
  };

  log.checkoutCreated(metadata.companyId, metadata.planId, "mandate_pending");

  const res = await fetch(url, {
    method: "POST",
    headers: await getZohoHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    log.paymentFailure(
      metadata.companyId,
      metadata.planId,
      `Mandate session creation failed: ${res.status} ${detail}`
    );
    throw new Error(`Failed to create mandate session: ${res.status} ${detail}`);
  }

  const data = await res.json();
  const session = data.payments_session || data.payment_session || data;

  const paymentsSessionId = session.payments_session_id || session.payment_session_id;

  if (!paymentsSessionId) {
    throw new Error(`Zoho did not return payments_session_id for mandate enrollment. Response: ${JSON.stringify(data)}`);
  }

  log.checkoutCreated(metadata.companyId, metadata.planId, paymentsSessionId);

  return {
    paymentsSessionId,
    amount: session.amount ?? amount,
    currency: session.currency ?? currency,
  };
}

// ─── Mandate Pre-Debit Notification ───────────────────────────────────────────

/**
 * Sends a Pre-Debit Notification to the customer 24 hours prior to mandate execution,
 * as required by RBI / NPCI e-Mandate guidelines.
 *
 * Endpoint: POST https://payments.zoho.in/api/v1/mandates/notify
 */
export async function sendMandateNotification(
  mandateId: string,
  amount: number,
  executionDate: string // YYYY-MM-DD format
): Promise<boolean> {
  const { accountId } = getZohoConfig();
  const url = `${ZOHO_API_BASE}/mandates/notify?account_id=${accountId}`;

  const body = {
    mandate_id: mandateId,
    amount: Number(amount),
    execution_date: executionDate,
    description: "Upcoming PrimeInbox Subscription Auto-Renewal",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: await getZohoHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`[Zoho Mandate Notify] Failed to notify mandate ${mandateId}: ${res.status} ${detail}`);
    return false;
  }

  return true;
}

// ─── Mandate Execution (Recurring Auto-Charge) ────────────────────────────────

export interface MandateExecutionResult {
  paymentId: string;
  status: string;
  rawResponse: Record<string, unknown>;
}

/**
 * Executes a recurring charge against an active mandate.
 * Step 1: Creates payment session with type "mandate_execution"
 * Step 2: Calls POST /mandates/execute
 */
export async function executeMandateCharge(
  mandateId: string,
  amount: number,
  currency: string,
  metadata: PaymentSessionMetadata
): Promise<MandateExecutionResult> {
  const { accountId } = getZohoConfig();

  // 1. Create execution payment session
  const sessionUrl = `${ZOHO_API_BASE}/paymentsessions?account_id=${accountId}`;
  const currencyCode = (currency || "INR").toUpperCase();

  const metaDataArray = Object.entries(metadata).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  const sessionBody = {
    amount: Number(amount),
    currency: currencyCode,
    type: "mandate_execution",
    description: `PrimeInbox ${metadata.planId} Auto-Renewal Charge`,
    meta_data: metaDataArray,
  };

  const sessionRes = await fetch(sessionUrl, {
    method: "POST",
    headers: await getZohoHeaders(),
    body: JSON.stringify(sessionBody),
  });

  if (!sessionRes.ok) {
    const detail = await sessionRes.text();
    throw new Error(`Failed to create mandate execution session: ${sessionRes.status} ${detail}`);
  }

  const sessionData = await sessionRes.json();
  const session = sessionData.payments_session || sessionData.payment_session || sessionData;
  const paymentsSessionId = session.payments_session_id || session.payment_session_id;

  if (!paymentsSessionId) {
    throw new Error(`Zoho did not return payments_session_id for mandate execution`);
  }

  // 2. Execute mandate charge
  const executeUrl = `${ZOHO_API_BASE}/mandates/execute?account_id=${accountId}`;
  const executeBody = {
    mandate_id: mandateId,
    payments_session_id: paymentsSessionId,
  };

  const executeRes = await fetch(executeUrl, {
    method: "POST",
    headers: await getZohoHeaders(),
    body: JSON.stringify(executeBody),
  });

  if (!executeRes.ok) {
    const detail = await executeRes.text();
    throw new Error(`Failed to execute mandate charge: ${executeRes.status} ${detail}`);
  }

  const executeData = await executeRes.json();
  const payment = executeData.payment || executeData;

  return {
    paymentId: payment.payment_id || executeData.payment_id || `txn_${Date.now()}`,
    status: payment.status || "succeeded",
    rawResponse: executeData,
  };
}

// ─── Payment Retrieval ────────────────────────────────────────────────────────

export interface ZohoPaymentDetails {
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  createdTime?: string;
  rawResponse: Record<string, unknown>;
}

/**
 * Retrieves payment details from Zoho by payment ID.
 *
 * Used for server-side verification after the checkout widget returns.
 * Confirms the payment status is "succeeded" before activating a subscription.
 *
 * Authentication: OAuth 2.0 (ZohoPay.payments.READ scope)
 * Endpoint: GET https://payments.zoho.in/api/v1/payments/{payment_id}
 */
export async function retrievePayment(
  paymentId: string
): Promise<ZohoPaymentDetails> {
  const { accountId } = getZohoConfig();

  const url = `${ZOHO_API_BASE}/payments/${paymentId}?account_id=${accountId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: await getZohoHeaders(),
  });

  if (!res.ok) {
    const detail = await res.text();
    log.verificationFailure(`Retrieve payment failed: ${res.status}`, paymentId);
    throw new Error(`Failed to retrieve payment: ${res.status} ${detail}`);
  }

  const data = await res.json();

  // Zoho response shape: { code: 0, message: "success", payment: { ... } }
  const payment = data.payment || data.payments || data;

  return {
    paymentId: payment.payment_id || paymentId,
    amount: payment.amount,
    currency: payment.currency || payment.currency_code || "INR",
    status: payment.status,
    paymentMethod: payment.payment_method,
    createdTime: payment.created_time,
    rawResponse: data,
  };
}

// ─── Webhook Signature Verification ──────────────────────────────────────────

interface WebhookSignatureParts {
  timestamp: string;
  signature: string;
}

/**
 * Parses the `X-Zoho-Webhook-Signature` header.
 * Format: `t=<timestamp>,v=<hex_signature>`
 */
function parseSignatureHeader(header: string): WebhookSignatureParts {
  const parts: Partial<WebhookSignatureParts> = {};

  for (const segment of header.split(",")) {
    const [key, ...valueParts] = segment.split("=");
    const value = valueParts.join("=");
    if (key === "t") parts.timestamp = value;
    if (key === "v") parts.signature = value;
  }

  if (!parts.timestamp || !parts.signature) {
    throw new Error("Invalid webhook signature header format");
  }

  return parts as WebhookSignatureParts;
}

/**
 * Verifies a Zoho webhook signature using HMAC-SHA256.
 *
 * Algorithm per official Zoho documentation:
 *   signed_data  = `${timestamp}.${raw_body}`
 *   expected_sig = HMAC-SHA256(signed_data, ZOHO_SIGNING_KEY).hex()
 *
 * Uses timing-safe comparison to prevent timing attacks.
 * The signing key is found in Payments Dashboard → Developer Space → Webhooks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  try {
    const { signingKey } = getZohoConfig();
    const { timestamp, signature } = parseSignatureHeader(signatureHeader);

    const data = `${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", signingKey)
      .update(data)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

import crypto from "crypto";

const ZOHO_API_BASE = "https://payments.zoho.in/api/v1";
const ZOHO_TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token";

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Zoho OAuth credentials missing in environment (ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN).");
  }

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
    throw new Error(`Failed to refresh Zoho OAuth token in backend: ${res.status} ${detail}`);
  }

  const data = (await res.json()) as any;
  if (data.error) {
    throw new Error(`Zoho OAuth error in backend: ${data.error}`);
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1_000;
  return cachedAccessToken!;
}

async function getZohoHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    Authorization: `Zoho-oauthtoken ${token}`,
    "Content-Type": "application/json",
  };
}

export class BackendZohoPaymentsService {
  /**
   * Sends 24-hour pre-debit notification required for mandate executions.
   */
  static async sendMandateNotification(
    mandateId: string,
    amount: number,
    executionDate: string
  ): Promise<boolean> {
    const accountId = process.env.ZOHO_ACCOUNT_ID;
    if (!accountId) return false;

    const url = `${ZOHO_API_BASE}/mandates/notify?account_id=${accountId}`;
    const body = {
      mandate_id: mandateId,
      amount: Number(amount),
      execution_date: executionDate,
      description: "Upcoming PrimeInbox Subscription Auto-Renewal",
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: await getZohoHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error(`[Zoho Backend Notify] Mandate ${mandateId} notification failed: ${res.status} ${detail}`);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error(`[Zoho Backend Notify] Exception for mandate ${mandateId}:`, err.message);
      return false;
    }
  }

  /**
   * Executes a mandate recurring charge.
   */
  static async executeMandateCharge(
    mandateId: string,
    amount: number,
    currency: string = "INR",
    metadata: Record<string, string>
  ): Promise<{ paymentId: string; status: string }> {
    const accountId = process.env.ZOHO_ACCOUNT_ID;
    if (!accountId) throw new Error("ZOHO_ACCOUNT_ID is missing.");

    // 1. Create execution payment session
    const sessionUrl = `${ZOHO_API_BASE}/paymentsessions?account_id=${accountId}`;
    const metaDataArray = Object.entries(metadata).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    const sessionBody = {
      amount: Number(amount),
      currency: (currency || "INR").toUpperCase(),
      type: "mandate_execution",
      description: `PrimeInbox ${metadata.planId || "Subscription"} Renewal Charge`,
      meta_data: metaDataArray,
    };

    const sessionRes = await fetch(sessionUrl, {
      method: "POST",
      headers: await getZohoHeaders(),
      body: JSON.stringify(sessionBody),
    });

    if (!sessionRes.ok) {
      const detail = await sessionRes.text();
      throw new Error(`Failed to create execution session: ${sessionRes.status} ${detail}`);
    }

    const sessionData = (await sessionRes.json()) as any;
    const session = sessionData.payments_session || sessionData.payment_session || sessionData;
    const paymentsSessionId = session.payments_session_id || session.payment_session_id;

    if (!paymentsSessionId) {
      throw new Error("Zoho did not return payments_session_id for mandate execution");
    }

    // 2. Execute mandate
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

    const executeData = (await executeRes.json()) as any;
    const payment = executeData.payment || executeData;

    return {
      paymentId: payment.payment_id || executeData.payment_id || `txn_${Date.now()}`,
      status: payment.status || "succeeded",
    };
  }
}

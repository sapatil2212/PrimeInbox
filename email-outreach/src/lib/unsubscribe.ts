import crypto from "crypto";

/**
 * Lightweight signed token used for one-click unsubscribe links/headers.
 * Format (base64url):  companyId.leadId.hmac
 */
const SECRET =
  process.env.SESSION_SECRET || process.env.JWT_SECRET || "primeinbox-unsub-fallback";

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
}

export function createUnsubToken(companyId: string, leadId: string): string {
  const payload = `${companyId}.${leadId}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString("base64url");
}

export function verifyUnsubToken(token: string): { companyId: string; leadId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [companyId, leadId, sig] = parts;
    if (sign(`${companyId}.${leadId}`) !== sig) return null;
    return { companyId, leadId };
  } catch {
    return null;
  }
}

export function unsubscribeUrl(companyId: string, leadId: string): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/unsubscribe?token=${createUnsubToken(companyId, leadId)}`;
}

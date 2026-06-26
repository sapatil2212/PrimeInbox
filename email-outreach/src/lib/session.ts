import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-at-least-32-chars-long"
);

// Separate secret + cookie for the Super Admin panel so it is fully isolated
// from regular user sessions. A normal session can never be used as an admin session.
const ADMIN_COOKIE = "admin_session";
const adminSecret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ||
    (process.env.JWT_SECRET || "fallback-secret-key-at-least-32-chars-long") + "::admin-scope-v1"
);

export interface SessionPayload {
  userId: string;
  companyId: string | null;
  role: string;
  email: string;
  name: string;
}

export interface AdminSessionPayload {
  userId: string;
  email: string;
  name: string;
  scope: "admin";
}

export async function encryptSession(payload: SessionPayload, expiresAt: Date): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);
}

export async function decryptSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload, rememberMe: boolean = false) {
  // Remember me sets it to 30 days, otherwise 24 hours
  const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + duration);
  
  const token = await encryptSession(payload, expiresAt);
  const cookieStore = await cookies();
  
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await decryptSession(token);
}

export async function destroySessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    sameSite: "lax",
    path: "/",
  });
}

/* ============================================================
 * SUPER ADMIN SESSION (separate, isolated, hardened)
 * ============================================================ */

export async function setAdminSessionCookie(
  payload: Omit<AdminSessionPayload, "scope">,
  rememberMe: boolean = false
) {
  // Admin sessions are short-lived: 8h normally, 7 days if "keep session active"
  const duration = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + duration);

  const token = await new SignJWT({ ...payload, scope: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(adminSecret);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "strict",
    path: "/",
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, adminSecret, {
      algorithms: ["HS256"],
    });
    if ((payload as { scope?: string }).scope !== "admin") return null;
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

export async function destroyAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    sameSite: "strict",
    path: "/",
  });
}

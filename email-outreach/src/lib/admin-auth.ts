import { NextResponse } from "next/server";
import { getAdminSession, type AdminSessionPayload } from "@/lib/session";

/**
 * Guard for Super Admin API routes.
 * Returns the admin session if a valid, dedicated admin session cookie exists,
 * otherwise returns a 403 NextResponse to short-circuit the handler.
 *
 * Usage:
 *   const admin = await requireAdmin();
 *   if (admin instanceof NextResponse) return admin;
 *   // admin.userId, admin.email available here
 */
export async function requireAdmin(): Promise<AdminSessionPayload | NextResponse> {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json(
      { error: "Admin authentication required." },
      { status: 403 }
    );
  }
  return admin;
}

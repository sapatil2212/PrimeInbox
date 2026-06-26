import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Route handler that clears the session cookie and redirects to /login.
 * Used when a stale session is detected (e.g. deleted user) — since cookies
 * cannot be modified in Server Components, we redirect here first.
 */
export async function GET() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

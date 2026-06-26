import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-at-least-32-chars-long"
);

// Dedicated, isolated secret for the Super Admin panel session.
const adminSecret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ||
    (process.env.JWT_SECRET || "fallback-secret-key-at-least-32-chars-long") + "::admin-scope-v1"
);

// Protected routes that require a regular authenticated user session
const PROTECTED_ROUTES = [
  "/dashboard",
  "/settings",
  "/billing",
  "/campaigns",
  "/smtp",
  "/leads",
];

// Auth routes that authenticated users should not access (redirect to dashboard)
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;

  let userSession = null;
  let tokenInvalid = false;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      userSession = payload;
    } catch {
      // Invalid/expired token — flag for cleanup
      tokenInvalid = true;
    }
  }

  // If the JWT is invalid/expired, clear the cookie so we don't keep retrying
  if (tokenInvalid) {
    const response = NextResponse.next();
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      sameSite: "lax",
      path: "/",
    });
    // If they were trying to reach a protected route, redirect to login
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (isProtectedRoute) {
      const url = new URL("/login", req.url);
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.cookies.set("session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
        sameSite: "lax",
        path: "/",
      });
      return redirectResponse;
    }
    return response;
  }

  // ===== Super Admin area: gated by the dedicated admin_session cookie =====
  if (pathname.startsWith("/admin")) {
    const adminToken = req.cookies.get("admin_session")?.value;
    let adminValid = false;
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, adminSecret, {
          algorithms: ["HS256"],
        });
        adminValid = (payload as { scope?: string }).scope === "admin";
      } catch {
        adminValid = false;
      }
    }
    if (!adminValid) {
      // Force authentication through the dedicated Super Admin portal.
      return NextResponse.redirect(new URL("/superadmin/login", req.url));
    }
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // 1. If trying to access a protected route and not logged in, redirect to login
  if (isProtectedRoute && !userSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 2. If logged in and trying to access login/register, redirect to dashboard
  if (isAuthRoute && userSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-at-least-32-chars-long"
);

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/settings",
  "/billing",
  "/campaigns",
  "/smtp",
  "/leads",
  "/admin",
];

// Auth routes that authenticated users should not access (redirect to dashboard)
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;
  
  let userSession = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      userSession = payload;
    } catch {
      // Invalid/expired token
    }
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
    // Keep target redirect path
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 2. If logged in and trying to access login/register, redirect to dashboard
  if (isAuthRoute && userSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. Role protection for admin route
  if (pathname.startsWith("/admin") && userSession && userSession.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
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

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes requiring authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/equipment",
  "/reservations",
  "/customers",
  "/inventory",
  "/payments",
  "/settings",
];

// Auth routes accessible only when unauthenticated
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth_token")?.value;
  const userRole = request.cookies.get("user_role")?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Unauthenticated user attempting to access protected route
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user attempting to access login/register (allow if reason param present e.g. session expired)
  const reason = request.nextUrl.searchParams.get("reason");
  if (isAuthRoute && authToken && !reason) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Role-based path restrictions
  if (authToken && userRole) {
    // Customers route restricted to ADMIN only
    if (pathname.startsWith("/customers") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Inventory route restricted to ADMIN, STAFF, and WAREHOUSE
    if (pathname.startsWith("/inventory") && !["ADMIN", "STAFF", "WAREHOUSE"].includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
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
     * - public assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};

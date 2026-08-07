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
    let defaultHome = "/dashboard";
    if (userRole === "WAREHOUSE") defaultHome = "/inventory";
    if (userRole === "STAFF") defaultHome = "/reservations";
    if (userRole === "CUSTOMER") defaultHome = "/equipment";
    return NextResponse.redirect(new URL(defaultHome, request.url));
  }

  // 3. Role-based path restrictions
  if (authToken && userRole) {
    // Non-admin users redirected away from /dashboard to their primary workspace
    if (pathname.startsWith("/dashboard")) {
      if (userRole === "WAREHOUSE") return NextResponse.redirect(new URL("/inventory", request.url));
      if (userRole === "STAFF") return NextResponse.redirect(new URL("/reservations", request.url));
      if (userRole === "CUSTOMER") return NextResponse.redirect(new URL("/equipment", request.url));
    }

    // Customers route restricted to ADMIN only
    if (pathname.startsWith("/customers") && userRole !== "ADMIN") {
      const home = userRole === "STAFF" ? "/reservations" : userRole === "WAREHOUSE" ? "/inventory" : "/equipment";
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Payments route restricted to ADMIN and STAFF only
    if (pathname.startsWith("/payments") && !["ADMIN", "STAFF"].includes(userRole)) {
      const home = userRole === "WAREHOUSE" ? "/inventory" : "/equipment";
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Inventory route restricted to ADMIN, STAFF, and WAREHOUSE
    if (pathname.startsWith("/inventory") && !["ADMIN", "STAFF", "WAREHOUSE"].includes(userRole)) {
      return NextResponse.redirect(new URL("/equipment", request.url));
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

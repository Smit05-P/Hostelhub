import { NextResponse } from "next/server";

export async function proxy(request) {
  // NOTE: sessionStorage is not accessible in Middleware.
  // Route protection and role-based guards have been moved to the client-side AuthContext
  // to support tab-isolated sessions (Admin in Tab 1, Student in Tab 2).
  
  const { pathname } = request.nextUrl;
  
  // You can still use middleware for things like headers or non-auth logic.
  // But for Auth, we now rely on the 'AuthContext' client-side guards.
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/student/:path*",
    "/hostel/dashboard/:path*",
    "/api/:path*",
  ],
};

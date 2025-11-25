import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;
  
  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (session && pathname === "/login") {
     return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*'
  ],
};
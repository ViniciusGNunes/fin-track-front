import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("X-Access-Token")?.value;

  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isProtectedPage =
    pathname.startsWith("/main") || pathname.startsWith("/dashboard");

  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/main", request.url));
  }

  return NextResponse.next();
}

const config = {
  matcher: ["/", "/main/:path*", "/dashboard/:path*"],
};

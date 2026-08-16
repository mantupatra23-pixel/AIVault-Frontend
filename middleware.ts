// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Static SEO files ko bypass karein
  if (
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Non-www to www redirect
  if (host === "aivault.pp.ua") {
    const url = request.nextUrl.clone();
    url.host = "www.aivault.pp.ua";
    url.protocol = "https";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

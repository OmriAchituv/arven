import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, isValidSession } from "~/lib/auth";

/**
 * Everything is behind the gate except the login page itself, the ingest
 * endpoint (which carries its own bearer token, for Shortcuts), and static
 * assets.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest).*)",
  ],
};

const PUBLIC_PATHS = ["/login", "/api/ingest"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const secret = process.env.ARVEN_SESSION_SECRET;
  if (!secret) {
    // No secret configured means no valid session can exist. Fail closed.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSession(cookie, secret)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

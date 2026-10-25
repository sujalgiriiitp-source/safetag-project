import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
    if ((origin && origin !== expected) || request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = { matcher: ["/api/:path*", "/pilot/:path*", "/receipt/:path*", "/dashboard/:path*", "/operator/:path*", "/superadmin/:path*"] };

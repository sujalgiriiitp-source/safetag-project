import { NextResponse } from "next/server";
import { getDepositByShortCode } from "@/lib/repository";
import { getCurrentSession } from "@/lib/session";
export const dynamic = "force-dynamic";

function resolveBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured;
  console.warn(
    "[safetag] NEXT_PUBLIC_APP_URL is not set — falling back to the request host for redirects. " +
      "Set NEXT_PUBLIC_APP_URL so QR codes and receipt links are absolute and scannable."
  );
  const host = request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const baseUrl = resolveBaseUrl(request);
  const session = await getCurrentSession();
  if (!session) return NextResponse.redirect(new URL("/login", baseUrl));
  const deposit = await getDepositByShortCode((await params).shortCode);
  if (!deposit || deposit.venueId !== session.venueId) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  return NextResponse.redirect(new URL(`/receipt/${deposit.tokenId}`, baseUrl));
}

import { NextResponse } from "next/server";
import { getDepositByShortCode } from "@/lib/repository";

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
  { params }: { params: { shortCode: string } }
) {
  const baseUrl = resolveBaseUrl(request);
  const deposit = await getDepositByShortCode(params.shortCode);
  if (!deposit) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  return NextResponse.redirect(new URL(`/receipt/${deposit.tokenId}`, baseUrl));
}

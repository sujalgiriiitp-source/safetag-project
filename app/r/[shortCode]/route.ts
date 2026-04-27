import { NextResponse } from "next/server";
import { getDepositByShortCode } from "@/lib/repository";

export async function GET(
  _request: Request,
  { params }: { params: { shortCode: string } }
) {
  const deposit = await getDepositByShortCode(params.shortCode);
  if (!deposit) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  return NextResponse.redirect(
    new URL(`/receipt/${deposit.tokenId}`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  );
}

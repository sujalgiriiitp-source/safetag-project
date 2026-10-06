import { NextResponse } from "next/server";
import { getDepositByTokenId, getVenueById } from "@/lib/repository";
import { maskPhone } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const deposit = await getDepositByTokenId(params.tokenId);
    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
    }

    const venue = await getVenueById(deposit.venueId);
    // Public receipt lookup: never expose raw phone numbers. Token IDs are
    // non-enumerable (random suffix), but masked PII is defense-in-depth.
    const publicDeposit = {
      ...deposit,
      visitorPhone: maskPhone(deposit.visitorPhone ?? ""),
      guardianPhone: deposit.guardianPhone ? maskPhone(deposit.guardianPhone) : deposit.guardianPhone
    };
    return Response.json({ deposit: publicDeposit, venue });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

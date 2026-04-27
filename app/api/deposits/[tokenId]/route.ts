import { NextResponse } from "next/server";
import { getDepositByTokenId, getVenueById } from "@/lib/repository";

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
    return Response.json({ deposit, venue });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

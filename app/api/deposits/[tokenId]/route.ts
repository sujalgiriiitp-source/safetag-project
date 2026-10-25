import { NextResponse } from "next/server";
import { getDepositByTokenId, getVenueById } from "@/lib/repository";
import { maskPhone } from "@/lib/utils";
import { getCurrentSession } from "@/lib/session";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Sign in required for legacy lookup" }, { status: 401 });
    const deposit = await getDepositByTokenId((await params).tokenId);
    if (!deposit || deposit.venueId !== session.venueId) {
      return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
    }

    const venue = await getVenueById(deposit.venueId);
    // Public receipt and scanner lookups return only the fields those views need.
    const publicDeposit = {
      tokenId: deposit.tokenId,
      visitorName: deposit.visitorName,
      visitorPhone: maskPhone(deposit.visitorPhone ?? ""),
      guardianPhone: deposit.guardianPhone ? maskPhone(deposit.guardianPhone) : undefined,
      venueId: deposit.venueId,
      venueType: deposit.venueType,
      venueCity: deposit.venueCity,
      venueName: deposit.venueName,
      itemsList: deposit.itemsList,
      aiDetectedItems: deposit.aiDetectedItems,
      operatorDetectedItems: deposit.operatorDetectedItems,
      visitorUploadPhotoUrl: deposit.visitorUploadPhotoUrl,
      operatorCapturedPhotoUrl: deposit.operatorCapturedPhotoUrl,
      photoMismatchAlert: deposit.photoMismatchAlert,
      status: deposit.status,
      shortUrl: deposit.shortUrl,
      receiptPdfUrl: deposit.receiptPdfUrl,
      checkInTime: deposit.checkInTime,
      returnTime: deposit.returnTime,
      collectionTime: deposit.collectionTime,
      printedAt: deposit.printedAt
    };
    return Response.json({ deposit: publicDeposit, venue });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

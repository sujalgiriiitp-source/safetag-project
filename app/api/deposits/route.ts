import { NextRequest, NextResponse } from "next/server";
import { generateReceiptPdfBuffer } from "@/lib/pdf";
import {
  createDeposit,
  getDepositByTokenId,
  getDeposits,
  getVenueById,
  updateDepositReceipt
} from "@/lib/repository";
import { getCurrentSession } from "@/lib/session";
import { sendDepositCreatedMessages } from "@/lib/notifications";
import { uploadBase64Asset } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || undefined;
    const query = searchParams.get("query") || undefined;
    // Tenant isolation: only this operator's venue deposits, never cross-venue.
    const deposits = await getDeposits({
      venueId: session.venueId,
      status: status as any,
      query
    });

    return Response.json({ deposits });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    const body = await request.json();

    if (!body.visitorName || !body.visitorPhone || !body.venueId || !body.venueType) {
      return NextResponse.json(
        { error: "Missing required deposit fields." },
        { status: 400 }
      );
    }

    const uploadedImageUrl = body.imageBase64
      ? await uploadBase64Asset(body.imageBase64, "safetag/visitor-items", `visitor-${Date.now()}`)
      : "";

    const deposit = await createDeposit({
      visitorName: body.visitorName,
      visitorPhone: body.visitorPhone,
      guardianPhone: body.guardianPhone,
      guardianName: body.guardianName,
      venueId: body.venueId,
      venueType: body.venueType,
      itemsList: body.itemsList ?? [],
      aiDetectedItems: body.aiDetectedItems ?? [],
      visitorUploadPhotoUrl: uploadedImageUrl,
      // Always derive the operator identity from the authenticated session.
      // Client-supplied checkedInByPhone is ignored to prevent spoofing;
      // empty string = visitor self check-in (OTP-verified, no operator).
      checkedInByPhone: session?.phone ?? ""
    });

    const venue = await getVenueById(deposit.venueId);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }

    const pdfBuffer = await generateReceiptPdfBuffer(deposit, venue);
    const pdfDataUri = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    const pdfUrl = await uploadBase64Asset(pdfDataUri, "safetag/receipts", deposit.tokenId);
    await updateDepositReceipt(deposit.tokenId, pdfUrl);

    const receipt = (await getDepositByTokenId(deposit.tokenId)) ?? deposit;
    await sendDepositCreatedMessages(receipt, venue);

    return NextResponse.json({ success: true, deposit: receipt });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

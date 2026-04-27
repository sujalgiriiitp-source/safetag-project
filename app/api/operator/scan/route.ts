import { NextRequest, NextResponse } from "next/server";
import {
  getDepositByTokenId,
  getVenueById,
  markDepositReturned,
  markDepositStored
} from "@/lib/repository";
import { getCurrentSession } from "@/lib/session";
import { sendDepositReturnedMessages } from "@/lib/notifications";
import { uploadBase64Asset } from "@/lib/storage";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { compareItemLists } from "@/lib/utils";
import { detectItemsFromImage } from "@/lib/vision";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Please log in as operator first." },
        { status: 401 }
      );
    }

    const { tokenId, action, photoBase64, fileName } = await request.json();
    const deposit = await getDepositByTokenId(tokenId);
    if (!deposit || deposit.venueId !== session.venueId) {
      return NextResponse.json(
        { error: "Deposit not found for your venue." },
        { status: 404 }
      );
    }

    const venue = await getVenueById(deposit.venueId);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }

    if (action === "stored") {
      let operatorPhotoUrl = deposit.operatorCapturedPhotoUrl || "";
      let operatorDetectedItems = deposit.operatorDetectedItems ?? [];

      if (photoBase64) {
        operatorPhotoUrl = await uploadBase64Asset(
          photoBase64,
          "safetag/operator-capture",
          `${tokenId}-${Date.now()}`
        );
        operatorDetectedItems = await detectItemsFromImage(
          photoBase64,
          fileName || `${tokenId}.jpg`,
          deposit.venueType
        );
      }

      if (!operatorPhotoUrl) {
        return NextResponse.json(
          { error: "Operator photo capture is required before marking as stored." },
          { status: 400 }
        );
      }

      const comparison = compareItemLists(deposit.itemsList, operatorDetectedItems);
      const updated = await markDepositStored(
        tokenId,
        session.phone,
        operatorPhotoUrl,
        operatorDetectedItems,
        comparison.mismatch
      );

      await sendWhatsAppMessage(
        deposit.visitorPhone,
        `SafeTag update\nToken: ${deposit.tokenId}\nStatus: Stored\nVenue: ${venue.name}\nPhoto proof saved successfully.`
      );

      return NextResponse.json({ success: true, deposit: updated, comparison });
    }

    if (action === "returned") {
      const updated = await markDepositReturned(tokenId, session.phone);
      await sendDepositReturnedMessages(updated ?? deposit, venue);

      return NextResponse.json({ success: true, deposit: updated });
    }

    return NextResponse.json({ error: "Unknown scan action." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan action failed" },
      { status: 500 }
    );
  }
}

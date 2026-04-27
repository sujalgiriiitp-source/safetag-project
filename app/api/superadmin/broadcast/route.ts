import { NextRequest, NextResponse } from "next/server";
import { getVenues } from "@/lib/repository";
import { sendWhatsAppMessage } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "message is required." }, { status: 400 });
    }

    const venues = await getVenues();
    await Promise.all(
      venues.map((venue) => sendWhatsAppMessage(venue.contactPhone, `SafeTag Broadcast\n${message}`))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Broadcast failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.to || !body.message) {
      return NextResponse.json(
        { error: "Phone number and message are required." },
        { status: 400 }
      );
    }

    await sendWhatsAppMessage(body.to, body.message);

    return NextResponse.json({
      success: true,
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send WhatsApp message." },
      { status: 500 }
    );
  }
}

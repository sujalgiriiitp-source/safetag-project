import { NextRequest, NextResponse } from "next/server";
import { createVenueRegistration } from "@/lib/repository";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { isDemoMode } from "@/lib/demo-mode";

export async function POST(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ error: "Venue registration is disabled in DEMO MODE." }, { status: 403 });
    }

    const body = await request.json();

    const requiredFields = [
      "name",
      "type",
      "city",
      "state",
      "address",
      "pincode",
      "contactName",
      "contactPhone"
    ];

    const missingField = requiredFields.find((field) => !body[field]);
    if (missingField) {
      return NextResponse.json(
        { error: `${missingField} is required.` },
        { status: 400 }
      );
    }

    const venue = await createVenueRegistration({
      name: body.name,
      type: body.type,
      city: body.city,
      state: body.state,
      address: body.address,
      pincode: body.pincode,
      contactName: body.contactName,
      contactPhone: body.contactPhone
    });

    await sendWhatsAppMessage(
      venue.contactPhone,
      `SafeTag update: ${venue.name} ka registration receive ho gaya hai. Approval pending hai. Team jald connect karegi.`
    );

    return NextResponse.json({ success: true, venue });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Venue registration failed" },
      { status: 500 }
    );
  }
}

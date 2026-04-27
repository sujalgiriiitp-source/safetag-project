import { NextRequest, NextResponse } from "next/server";
import { createVenueRegistration } from "@/lib/repository";
import { sendWhatsAppMessage } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
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

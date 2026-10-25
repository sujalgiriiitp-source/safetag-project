import { NextRequest, NextResponse } from "next/server";
import { createVenueRegistration } from "@/lib/repository";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { isDemoMode } from "@/lib/demo-mode";
import { consumeRegistrationGrant } from "@/lib/pilot/auth";
import { failure, jsonBody, phone } from "@/lib/pilot/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ error: "Venue registration is disabled in DEMO MODE." }, { status: 403 });
    }

    const body = z.object({ name: z.string().trim().min(2).max(120), type: z.enum(["exam", "temple", "park", "museum", "religious", "amusement", "govt", "event"]), city: z.string().min(2).max(100), state: z.string().min(2).max(100), address: z.string().min(5).max(500), pincode: z.string().regex(/^\d{6}$/), contactName: z.string().min(2).max(100), contactPhone: phone }).parse(await jsonBody(request));

    await consumeRegistrationGrant(body.contactPhone);
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

    if (process.env.LEGACY_NOTIFICATIONS_ENABLED === "true") await sendWhatsAppMessage(
      venue.contactPhone,
      `SafeTag update: ${venue.name} ka registration receive ho gaya hai. Approval pending hai. Team jald connect karegi.`
    );

    return NextResponse.json({ success: true, venue });
  } catch (error) {
    return failure(error);
  }
}

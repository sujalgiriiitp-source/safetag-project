import { NextRequest } from "next/server";
import { createWaitlistEntry, getWaitlistCount } from "@/lib/repository";
import { sendWaitlistConfirmation } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = await createWaitlistEntry({
      email: body.email,
      phone: body.phone,
      venueName: body.venueName,
      venueType: body.venueType,
      city: body.city
    });
    const position = await getWaitlistCount();

    await sendWaitlistConfirmation(entry.phone, entry.venueName, position);

    return Response.json({ success: true, position });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not join waitlist." },
      { status: 500 }
    );
  }
}

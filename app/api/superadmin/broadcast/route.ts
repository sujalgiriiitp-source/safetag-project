import { NextRequest, NextResponse } from "next/server";
import { getVenues } from "@/lib/repository";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { getCurrentSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // TODO(security): AuthSession has no "superadmin" role (OperatorRole = "operator" | "admin").
    // Gating on "admin" as a stopgap — add a real superadmin role/allowlist before production use.
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

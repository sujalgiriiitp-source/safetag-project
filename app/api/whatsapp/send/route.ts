import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { getCurrentSession, isPlatformAdmin } from "@/lib/session";
import { isDemoMode } from "@/lib/demo-mode";

export async function POST(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ error: "WhatsApp messaging is disabled in DEMO MODE." }, { status: 403 });
    }

    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isPlatformAdmin(session) || process.env.ALLOW_AUTHORIZED_TEST_SEND !== "true") return NextResponse.json({ error: "Use opted-in pilot notification jobs. Live test sending is disabled." }, { status: 403 });

    const body = await request.json();
    if (!body.to || !body.message) {
      return NextResponse.json(
        { error: "Phone number and message are required." },
        { status: 400 }
      );
    }

    if (!(process.env.NOTIFICATION_TEST_RECIPIENTS || "").split(",").includes(body.to)) return NextResponse.json({ error: "Recipient not authorized for testing" }, { status: 403 });
    const sid = await sendWhatsAppMessage(body.to, body.message);
    if (!sid) return NextResponse.json({ error: "Message not accepted by provider" }, { status: 503 });

    return NextResponse.json({
      success: true,
      state: "queued", sid
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send WhatsApp message." },
      { status: 500 }
    );
  }
}

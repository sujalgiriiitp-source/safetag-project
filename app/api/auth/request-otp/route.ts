import { NextRequest, NextResponse } from "next/server";
import { getOperatorByPhone } from "@/lib/repository";
import { sendOtp } from "@/lib/twilio";
import { isDemoMode } from "@/lib/demo-mode";
import { phone as phoneSchema, jsonBody, limit, failure } from "@/lib/pilot/security";
import { platformPhone } from "@/lib/pilot/auth";
import { InviteModel } from "@/models/Pilot";
import { hash } from "@/lib/pilot/security";

export async function POST(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(
        { error: "OTP login is disabled in DEMO MODE. Use the dedicated demo credentials." },
        { status: 403 }
      );
    }

    const body = await jsonBody(request);
    const phone = phoneSchema.parse(body.phone), purpose = body.purpose;
    if (!["operator_login", "venue_registration"].includes(purpose)) return NextResponse.json({ error: "Unsupported OTP purpose" }, { status: 400 });
    await limit("otp-send", phone, 5, 600);
    if (!phone || !purpose) {
      return NextResponse.json({ error: "Phone and purpose are required." }, { status: 400 });
    }

    if (purpose === "operator_login") {
      const operator = await getOperatorByPhone(phone);
      const invited = body.inviteToken && await InviteModel.exists({ _id: hash(String(body.inviteToken)), phone, expiresAt: { $gt: new Date() } });
      if (!operator && !platformPhone(phone) && !invited) {
        return NextResponse.json({ error: "Operator account not found for this phone." }, { status: 404 });
      }
    }

    const result = await sendOtp(phone, purpose);
    // Note: the OTP code itself is never returned to the client.
    return NextResponse.json({
      success: true,
      mode: result.mode
    });
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "OTP_NOT_CONFIGURED") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return failure(error);
  }
}

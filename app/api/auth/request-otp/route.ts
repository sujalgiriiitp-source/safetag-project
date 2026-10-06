import { NextRequest, NextResponse } from "next/server";
import { getOperatorByPhone } from "@/lib/repository";
import { sendOtp } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const { phone, purpose } = await request.json();
    if (!phone || !purpose) {
      return NextResponse.json({ error: "Phone and purpose are required." }, { status: 400 });
    }

    if (purpose === "operator_login") {
      const operator = await getOperatorByPhone(phone);
      if (!operator) {
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
    console.error(error);
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "OTP_NOT_CONFIGURED") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OTP request failed" },
      { status: 500 }
    );
  }
}

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
    return NextResponse.json({
      success: true,
      mode: result.mode,
      demoCode: "demoCode" in result ? result.demoCode : undefined
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OTP request failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/session";
import { getOperatorByPhone } from "@/lib/repository";
import { verifyOtp } from "@/lib/twilio";
import { OtpPurpose } from "@/types";

async function readVerifyOtpBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();

    return {
      phone: formData.get("phone"),
      purpose: formData.get("purpose"),
      code: formData.get("code")
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await readVerifyOtpBody(request);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "A valid request body is required." }, { status: 400 });
    }

    const { phone, purpose, code } = body as {
      code?: FormDataEntryValue | null;
      phone?: FormDataEntryValue | null;
      purpose?: FormDataEntryValue | null;
    };

    if (!phone || !purpose || !code) {
      return NextResponse.json({ error: "Phone, purpose, and code are required." }, { status: 400 });
    }

    const normalizedPhone = String(phone);
    const normalizedPurpose = String(purpose) as OtpPurpose;
    const normalizedCode = String(code);

    const verified = await verifyOtp(normalizedPhone, normalizedPurpose, normalizedCode);
    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 });
    }

    if (normalizedPurpose === "operator_login") {
      const operator = await getOperatorByPhone(normalizedPhone);
      if (!operator) {
        return NextResponse.json({ error: "Operator account not found." }, { status: 404 });
      }

      await createSessionCookie({
        operatorId: operator._id,
        venueId: operator.venueId,
        role: operator.role,
        phone: operator.phone,
        name: operator.name
      });

      return NextResponse.json({
        success: true,
        redirectTo: "/dashboard",
        operator
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OTP verification failed" },
      { status: 500 }
    );
  }
}

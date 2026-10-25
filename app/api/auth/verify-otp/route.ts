import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/session";
import { getOperatorByPhone } from "@/lib/repository";
import { verifyOtp } from "@/lib/twilio";
import { OtpPurpose } from "@/types";
import { isDemoMode } from "@/lib/demo-mode";
import { phone as phoneSchema, limit, failure } from "@/lib/pilot/security";
import { platformFactor, platformPhone, registrationGrant } from "@/lib/pilot/auth";
import { acceptInvite } from "@/lib/pilot/custody";

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
    if (isDemoMode()) {
      return NextResponse.json(
        { error: "OTP login is disabled in DEMO MODE. Use the dedicated demo credentials." },
        { status: 403 }
      );
    }

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

    const normalizedPhone = phoneSchema.parse(String(phone));
    const normalizedPurpose = String(purpose) as OtpPurpose;
    const normalizedCode = String(code);
    if (!["operator_login", "venue_registration"].includes(normalizedPurpose)) return NextResponse.json({ error: "Unsupported OTP purpose" }, { status: 400 });
    await limit("otp-verify", normalizedPhone, 8, 600);

    const verified = await verifyOtp(normalizedPhone, normalizedPurpose, normalizedCode);
    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 });
    }

    if (normalizedPurpose === "operator_login") {
      if (platformPhone(normalizedPhone)) {
        await platformFactor(normalizedPhone, String((body as Record<string, unknown>).totpCode || ""));
        await createSessionCookie({ operatorId: `platform-${normalizedPhone.slice(-4)}`, venueId: "platform", role: "admin", name: "Platform administrator", phone: normalizedPhone, platformAdmin: true });
        return NextResponse.json({ success: true, redirectTo: "/pilot/platform" });
      }
      const invite = (body as Record<string, unknown>).inviteToken;
      const invited = typeof invite === "string" ? await acceptInvite(invite, normalizedPhone) : null;
      const operator = invited ? { _id: invited._id.toString(), venueId: invited.venueId.toString(), role: invited.role, phone: invited.phone, name: invited.name } : await getOperatorByPhone(normalizedPhone);
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
        redirectTo: "/pilot",
        operator
      });
    }

    await registrationGrant(normalizedPhone);
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

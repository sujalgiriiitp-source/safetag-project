import { randomBytes } from "node:crypto";
import { TOTP, Secret } from "otpauth";
import { cookies } from "next/headers";
import { GrantModel, RateModel } from "@/models/Pilot";
import { connectToDatabase } from "@/lib/mongodb";
import { hash, PilotError } from "@/lib/pilot/security";

export const platformPhone = (phone: string) => (process.env.PLATFORM_ADMIN_PHONES || "").split(",").map((value) => value.trim()).includes(phone);
export async function platformFactor(phone: string, code: string, timestamp = Date.now()) {
  const value = process.env.PLATFORM_ADMIN_TOTP_SECRET;
  if (!value || !/^[A-Z2-7]{32,}$/.test(value)) throw new PilotError(503, "MFA_CONFIGURATION", "Platform admin TOTP is not configured");
  const totp = new TOTP({ secret: Secret.fromBase32(value), algorithm: "SHA1", digits: 6, period: 30 });
  const delta = totp.validate({ token: code, timestamp, window: 1 });
  if (delta === null) throw new PilotError(401, "MFA", "Valid platform authenticator code required");
  const counter = Math.floor(timestamp / 30_000) + delta;
  try { await RateModel.create({ _id: hash(`totp:${phone}:${counter}`), count: 1, expiresAt: new Date(timestamp + 120_000) }); }
  catch (error) {
    if ((error as { code?: number }).code === 11000) throw new PilotError(401, "MFA_REPLAY", "Authenticator code already used");
    throw error;
  }
}

export async function registrationGrant(phone: string) {
  await connectToDatabase();
  const raw = randomBytes(32).toString("base64url");
  await GrantModel.create({ _id: hash(raw), phone, purpose: "venue_registration", expiresAt: new Date(Date.now() + 600_000) });
  (await cookies()).set("safetag-registration", raw, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 600 });
}
export async function consumeRegistrationGrant(phone: string) {
  await connectToDatabase();
  const store = await cookies(); const raw = store.get("safetag-registration")?.value || "";
  const grant = await GrantModel.findOneAndDelete({ _id: hash(raw), phone, purpose: "venue_registration", expiresAt: { $gt: new Date() } });
  if (!grant) throw new PilotError(403, "VERIFY_PHONE", "Verify the venue contact phone before registration");
  store.delete("safetag-registration");
}

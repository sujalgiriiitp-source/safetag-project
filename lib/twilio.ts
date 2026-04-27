import Twilio from "twilio";
import { DEMO_OTP } from "@/lib/constants";
import { consumeOtpSession, createOtpSession } from "@/lib/repository";
import { OtpPurpose } from "@/types";

const twilioCredentialsConfigured =
  Boolean(process.env.TWILIO_ACCOUNT_SID) &&
  Boolean(process.env.TWILIO_AUTH_TOKEN);

const verifyConfigured =
  twilioCredentialsConfigured && Boolean(process.env.TWILIO_VERIFY_SERVICE_SID);

type TwilioClient = ReturnType<typeof Twilio>;

let cachedClient: TwilioClient | null = null;

function getTwilioClient() {
  if (!twilioCredentialsConfigured || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  return cachedClient;
}

const rateLimitStore = new Map<string, number[]>();

function assertRateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const timestamps = rateLimitStore.get(key) ?? [];
  const filtered = timestamps.filter((value) => now - value < windowMs);
  if (filtered.length >= limit) {
    throw new Error("Too many OTP requests. Please wait and try again.");
  }
  filtered.push(now);
  rateLimitStore.set(key, filtered);
}

export async function sendOtp(phone: string, purpose: OtpPurpose) {
  assertRateLimit(`${purpose}:${phone}`);

  const client = getTwilioClient();

  if (verifyConfigured && client && process.env.TWILIO_VERIFY_SERVICE_SID) {
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });

    return { mode: "twilio" as const };
  }

  await createOtpSession(phone, purpose, DEMO_OTP);
  return { mode: "demo" as const, demoCode: DEMO_OTP };
}

export async function verifyOtp(phone: string, purpose: OtpPurpose, code: string) {
  const client = getTwilioClient();

  if (verifyConfigured && client && process.env.TWILIO_VERIFY_SERVICE_SID) {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });

    return result.status === "approved";
  }

  return consumeOtpSession(phone, purpose, code);
}

function formatIndianNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  }

  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length !== 10) {
    throw new Error(`Invalid Indian phone number: ${phone}`);
  }

  return `+91${cleaned}`;
}

function getWhatsAppFromNumber() {
  return (
    process.env.TWILIO_WHATSAPP_NUMBER ||
    process.env.TWILIO_WHATSAPP_FROM ||
    "whatsapp:+14155238886"
  );
}

export async function sendWhatsAppAlert(numbers: string[], message: string) {
  const uniqueNumbers = [...new Set(numbers.filter(Boolean))];
  if (!uniqueNumbers.length) return null;

  const client = getTwilioClient();

  if (!client) {
    console.error("WhatsApp error: Twilio client is not configured");
    return null;
  }

  const messageSids: string[] = [];

  for (const number of uniqueNumbers) {
    try {
      const formattedPhone = formatIndianNumber(number);
      const phone = formattedPhone.replace(/^\+91/, "");

      console.log("Sending to:", formattedPhone);

      const response = await client.messages.create({
        from: getWhatsAppFromNumber(),
        to: `whatsapp:+91${phone}`,
        body: message
      });

      console.log(`WhatsApp sent to ${formattedPhone}:`, response.sid);
      messageSids.push(response.sid);
    } catch (error) {
      console.error(`WhatsApp error for ${number}:`, error);
      return null;
    }
  }

  return messageSids;
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const result = await sendWhatsAppAlert([to], message);
  return result?.[0] ?? null;
}

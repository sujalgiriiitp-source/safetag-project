import crypto from "crypto";
import { cookies } from "next/headers";
import { AuthSession } from "@/types";

const COOKIE_NAME = "safetag-session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET is not set. Set it to a long random value before deploying — " +
          "without it, session cookies can be forged by anyone."
      );
    }
    console.warn(
      "[safetag] SESSION_SECRET is not set — using an insecure dev-only fallback secret. " +
        "Never deploy without a real SESSION_SECRET."
    );
    return "safetag-demo-secret";
  }
  return secret;
}

function encode(payload: AuthSession) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function decode(token: string): AuthSession | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");

  if (expected !== signature) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as AuthSession;
  } catch {
    return null;
  }
}

export async function createSessionCookie(session: AuthSession) {
  const token = encode(session);
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decode(token);
}

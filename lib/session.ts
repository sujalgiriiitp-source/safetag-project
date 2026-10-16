import crypto from "crypto";
import { cookies } from "next/headers";
import { AuthSession } from "@/types";
import { isDemoMode } from "@/lib/demo-mode";

const COOKIE_NAME = "safetag-session";
const DEMO_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

type ServerSession = {
  session: AuthSession;
  expiresAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var safeTagDemoSessions: Map<string, ServerSession> | undefined;
}

function getDemoSessions() {
  global.safeTagDemoSessions ??= new Map();
  const now = Date.now();
  for (const [token, session] of global.safeTagDemoSessions) {
    if (session.expiresAt <= now) global.safeTagDemoSessions.delete(token);
  }
  return global.safeTagDemoSessions;
}

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
  if (isDemoMode()) {
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = Date.now() + DEMO_SESSION_MAX_AGE_SECONDS * 1000;
    getDemoSessions().set(token, { session, expiresAt });

    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DEMO_SESSION_MAX_AGE_SECONDS
    });
    return;
  }

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
  const currentToken = cookieStore.get(COOKIE_NAME)?.value;
  if (currentToken) getDemoSessions().delete(currentToken);
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  if (isDemoMode()) {
    const stored = getDemoSessions().get(token);
    if (!stored) return null;
    if (stored.expiresAt <= Date.now()) {
      getDemoSessions().delete(token);
      return null;
    }
    return stored.session;
  }
  return decode(token);
}

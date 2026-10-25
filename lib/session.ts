import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { AuthSession } from "@/types";
import { isDemoMode } from "@/lib/demo-mode";
import { connectToDatabase } from "@/lib/mongodb";
import { SessionModel } from "@/models/Pilot";
import { OperatorModel } from "@/models/Operator";
import { hash } from "@/lib/pilot/security";

const COOKIE_NAME = "safetag-session";
const MAX_AGE = 8 * 60 * 60;
declare global { var safeTagPilotDemoSessions: Map<string, { session: AuthSession; expiresAt: number }> | undefined }
const demos = () => (global.safeTagPilotDemoSessions ??= new Map());

export function isPlatformAdmin(session: AuthSession | null) {
  const allowlist = (process.env.PLATFORM_ADMIN_PHONES || "").split(",").map((value) => value.trim());
  return Boolean(session?.platformAdmin && allowlist.includes(session.phone));
}

/** Opaque, server-revocable session; the cookie never contains a role or phone. */
export async function createSessionCookie(session: AuthSession) {
  const raw = randomBytes(32).toString("base64url");
  if (isDemoMode()) demos().set(hash(raw), { session, expiresAt: Date.now() + MAX_AGE * 1000 });
  else {
    await connectToDatabase();
    await SessionModel.create({ _id: hash(raw), ...session, createdAt: new Date(), expiresAt: new Date(Date.now() + MAX_AGE * 1000) });
  }
  (await cookies()).set(COOKIE_NAME, raw, {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE
  });
}

export async function clearSessionCookie() {
  const store = await cookies(); const raw = store.get(COOKIE_NAME)?.value;
  if (raw) {
    if (isDemoMode()) demos().delete(hash(raw));
    else { await connectToDatabase(); await SessionModel.deleteOne({ _id: hash(raw) }); }
  }
  store.delete(COOKIE_NAME);
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  return resolveSession(raw);
}

/** Shared by request authentication and tests; permissions are re-read, never trusted from the cookie. */
export async function resolveSession(raw: string | undefined): Promise<AuthSession | null> {
  if (!raw || !/^[A-Za-z0-9_-]{43}$/.test(raw)) return null;
  if (isDemoMode()) {
    const value = demos().get(hash(raw));
    return value && value.expiresAt > Date.now() ? value.session : null;
  }
  await connectToDatabase();
  const value = await SessionModel.findOne({ _id: hash(raw), expiresAt: { $gt: new Date() } }).lean();
  if (!value) return null;
  const session = value as unknown as AuthSession;
  if (session.platformAdmin) return isPlatformAdmin(session) ? session : null;
  const operator = await OperatorModel.findOne({ _id: session.operatorId, venueId: session.venueId, isActive: true });
  if (!operator) return null;
  return { ...session, role: operator.role, name: operator.name, phone: operator.phone };
}

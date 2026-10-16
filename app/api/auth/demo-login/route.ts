import { NextRequest, NextResponse } from "next/server";
import { verifyDemoCredentials } from "@/lib/demo-auth";
import { isDemoMode } from "@/lib/demo-mode";
import { getOperatorByPhone } from "@/lib/repository";
import { createSessionCookie } from "@/lib/session";

const DEMO_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const DEMO_LOGIN_LIMIT = 5;
const loginAttempts = new Map<string, number[]>();

function isRateLimited(key: string) {
  const now = Date.now();
  const recentAttempts = (loginAttempts.get(key) ?? []).filter(
    (attempt) => now - attempt < DEMO_LOGIN_WINDOW_MS
  );
  loginAttempts.set(key, recentAttempts);
  return recentAttempts.length >= DEMO_LOGIN_LIMIT;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const recentAttempts = (loginAttempts.get(key) ?? []).filter(
    (attempt) => now - attempt < DEMO_LOGIN_WINDOW_MS
  );
  recentAttempts.push(now);
  loginAttempts.set(key, recentAttempts);
}

export async function POST(request: NextRequest) {
  try {
    if (!isDemoMode()) {
      return NextResponse.json({ error: "Demo login is disabled." }, { status: 404 });
    }

    const clientKey = request.ip || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (isRateLimited(clientKey)) {
      return NextResponse.json({ error: "Too many demo login attempts. Try again in 15 minutes." }, { status: 429 });
    }

    const body = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      typeof body.username !== "string" ||
      typeof body.password !== "string" ||
      body.username.length > 100 ||
      body.password.length > 1024
    ) {
      return NextResponse.json({ error: "Valid demo credentials are required." }, { status: 400 });
    }

    if (!(await verifyDemoCredentials(body.username, body.password))) {
      recordFailedAttempt(clientKey);
      return NextResponse.json({ error: "Invalid demo credentials." }, { status: 401 });
    }
    loginAttempts.delete(clientKey);

    const operator = await getOperatorByPhone("demo-operator");
    if (!operator || operator.role !== "operator") {
      return NextResponse.json({ error: "Demo operator account is unavailable." }, { status: 503 });
    }

    await createSessionCookie({
      operatorId: operator._id,
      venueId: operator.venueId,
      role: "operator",
      phone: operator.phone,
      name: operator.name
    });

    return NextResponse.json({ success: true, redirectTo: "/dashboard" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Demo login is unavailable." }, { status: 500 });
  }
}

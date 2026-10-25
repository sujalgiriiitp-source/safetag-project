import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { RateModel } from "@/models/Pilot";

export class PilotError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const phone = z.string().transform((value) => {
  const digits = value.replace(/\D/g, "");
  return `+91${digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.replace(/^0(?=\d{10}$)/, "")}`;
}).pipe(z.string().regex(/^\+91[6-9]\d{9}$/, "Use a valid Indian mobile number"));
export const keySchema = z.string().uuid();
export const idSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function secret() {
  const value = process.env.TOKEN_SECRET;
  if (!value || Buffer.byteLength(value) < 32) throw new PilotError(503, "CONFIGURATION", "TOKEN_SECRET must contain at least 32 bytes");
  return value;
}
export function token(nonce: string, purpose: string) {
  return createHmac("sha256", secret()).update(`${purpose}:${nonce}`).digest("base64url");
}
export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_APP_URL;
  if (origin && origin !== new URL(expected || request.url).origin) throw new PilotError(403, "ORIGIN", "Request origin not allowed");
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new PilotError(403, "ORIGIN", "Cross-site request not allowed");
}
export async function boundedText(request: Request, maxBytes = 32_768) {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new PilotError(413, "SIZE", "Request too large");
  const reader = request.body?.getReader();
  if (!reader) throw new PilotError(400, "BODY", "JSON body required");
  let size = 0; const parts: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length;
    if (size > maxBytes) { await reader.cancel(); throw new PilotError(413, "SIZE", "Request too large"); }
    parts.push(value);
  }
  return Buffer.concat(parts).toString("utf8");
}
export async function jsonBody(request: Request, maxBytes = 32_768) {
  const text = await boundedText(request, maxBytes);
  try { return JSON.parse(text); }
  catch { throw new PilotError(400, "JSON", "Invalid JSON body"); }
}
/** Fixed-window limits live in Mongo, shared by all app/worker instances. */
export async function limit(action: string, identity: string, max = 30, seconds = 60) {
  await connectToDatabase();
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const _id = hash(`${action}:${identity}:${bucket}`);
  const value = await RateModel.findOneAndUpdate({ _id }, {
    $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * seconds * 1000) }
  }, { new: true, upsert: true });
  if (value.count > max) throw new PilotError(429, "RATE_LIMIT", "Too many attempts. Please wait / Kripya thoda rukiye");
}
export function failure(error: unknown) {
  if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message || "Invalid input", code: "VALIDATION" }, { status: 400 });
  if (error instanceof PilotError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
  console.error(JSON.stringify({ event: "request_failed", type: error instanceof Error ? error.name : "UnknownError" }));
  return Response.json({ error: "Service unavailable. Retry safely using the same request.", code: "UNAVAILABLE" }, { status: 503 });
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

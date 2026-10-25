import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { TOTP, Secret } from "otpauth";
import mongoose from "mongoose";
import sharp from "sharp";
import Twilio from "twilio";
import type { AuthSession } from "@/types";

process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || `mongodb://127.0.0.1:27029/safetag_test_${randomUUID().replaceAll("-", "")}`;
if (!/^mongodb:\/\/127\.0\.0\.1:27029\/safetag_test_[a-zA-Z0-9_]+$/.test(process.env.MONGODB_URI)) throw new Error("Tests require a disposable LOCAL safetag_test_ database on port 27029");
process.env.TOKEN_SECRET = "synthetic-token-secret-for-isolated-test-only-0123456789";
process.env.SESSION_SECRET = "synthetic-session-secret-for-isolated-test-only-012345";
process.env.DEMO_MODE = "false";
process.env.NOTIFICATIONS_ENABLED = "false";
process.env.STORAGE_DRIVER = "mongo";
process.env.NEXT_PUBLIC_APP_URL = "https://pilot.example.test";

const { connectToDatabase } = await import("@/lib/mongodb");
const { CustodyModel, OperationsModel, RateModel, OptOutModel, SessionModel, InviteModel, AuditModel } = await import("@/models/Pilot");
const { VenueModel } = await import("@/models/Venue");
const { OperatorModel } = await import("@/models/Operator");
const { AssetModel } = await import("@/models/PilotAsset");
const { authorize, registerCustody, findCustody, storeCustody, returnCustody, managerAction, publicReceipt, saveOperations, staffAction, acceptInvite } = await import("@/lib/pilot/custody");
const { savePhoto, readPhoto, sanitizePhoto, purgeExpiredPhotos } = await import("@/lib/pilot/media");
const { resolveSession, isPlatformAdmin } = await import("@/lib/session");
const { platformFactor } = await import("@/lib/pilot/auth");
const { drainNotifications, applyDelivery, messageState, verifyTwilio } = await import("@/lib/pilot/notifications");
const { hash, phone, csvCell, limit, token, jsonBody } = await import("@/lib/pilot/security");
let actor: AuthSession, foreign: AuthSession, manager: AuthSession;
let image: Buffer;

before(async () => {
  await connectToDatabase();
  await Promise.all([CustodyModel.init(), OperationsModel.init(), RateModel.init(), OptOutModel.init(), SessionModel.init(), AssetModel.init(), InviteModel.init(), AuditModel.init()]);
  const makeVenue = async (name: string) => VenueModel.create({ name, type: "exam", city: "Test City", state: "Test State", address: "Synthetic test address", pincode: "226001", contactName: "Synthetic Manager", contactPhone: "+919999999991", isApproved: true });
  const a = await makeVenue("Synthetic Pilot A"), b = await makeVenue("Synthetic Pilot B");
  const makeStaff = async (venueId: string, role: "operator" | "admin", phoneValue: string): Promise<AuthSession> => {
    const operator = await OperatorModel.create({ name: `Synthetic ${role}`, venueId, role, phone: phoneValue, isActive: true });
    return { operatorId: operator._id.toString(), venueId, role, phone: phoneValue, name: operator.name };
  };
  actor = await makeStaff(a._id.toString(), "operator", "+919999999991");
  manager = await makeStaff(a._id.toString(), "admin", "+919999999992");
  foreign = await makeStaff(b._id.toString(), "operator", "+919999999993");
  await OperationsModel.create({ venueId: actor.venueId, review: "approved", hours: "09:00-18:00", locations: Array.from({ length: 30 }, (_, i) => `A-${i}`), acceptedItems: ["Mobile Phone"], prohibitedItems: ["Weapons"], feePaise: 500, pricingTerms: "Rs5 per deposit", retentionDays: 30 });
  image = await sharp({ create: { width: 100, height: 100, channels: 3, background: "#0891b2" } }).jpeg().toBuffer();
});
after(async () => { if (mongoose.connection.db) await mongoose.connection.db.dropDatabase(); await mongoose.disconnect(); });
const body = () => ({ requestKey: randomUUID(), visitorName: "Synthetic Visitor", visitorPhone: "9999999994", guardianPhone: "9999999995", visitorConsent: true, guardianConsent: true, items: [{ name: "Mobile Phone", quantity: 2, condition: "Visible scratch on case", notes: "Switched off" }] });
async function stored(location: string) {
  const created = await registerCustody(actor, body());
  const photo = await savePhoto(actor, created.record.id, image);
  await storeCustody(actor, created.record.id, { location, photoAsset: photo.assetId, physicalAcceptance: true, itemsVerified: true });
  await managerAction(actor, created.record.id, { action: "payment", state: "paid", method: "cash", reference: "TEST-CASH", reason: "Synthetic cash counted" });
  return created;
}
const returning = (collectionCode: string) => ({ requestKey: randomUUID(), collectionCode, physicalHandover: true, itemsVerified: true });

test("phone normalization preserves valid 91-prefix national numbers", () => {
  for (const value of ["6306601592", "91+6306601592", "+91+630-660 1592", "whatsapp:+916306601592"]) assert.equal(phone.parse(value), "+916306601592");
  assert.equal(phone.parse("9199999999"), "+919199999999");
  assert.throws(() => phone.parse("123"));
});
test("unauthenticated and cross-venue requests rejected", async () => {
  await assert.rejects(authorize(null), { status: 401 });
  const created = await registerCustody(actor, body());
  await assert.rejects(findCustody(foreign, created.record.id), { status: 404 });
  await assert.rejects(saveOperations(actor, {}), { status: 403 });
});
test("idempotent registration reuses record and credentials; changed payload rejected", async () => {
  const input = body();
  const results = await Promise.all(Array.from({ length: 8 }, () => registerCustody(actor, input)));
  assert.equal(new Set(results.map((v) => v.record.id)).size, 1);
  assert.equal(new Set(results.map((v) => v.collectionCode)).size, 1);
  await assert.rejects(registerCustody(actor, { ...input, visitorName: "Different" }), { status: 409 });
  assert.equal(results[0].record.state, "REGISTERED");
  const persisted = await CustodyModel.findById(results[0].record.id).lean();
  assert.equal(persisted!.outbox.length, 0);
  assert.notEqual(persisted!.collectionHash, results[0].collectionCode);
});
test("capacity index admits only one physical allocation under concurrency", async () => {
  const [a, b] = await Promise.all([registerCustody(actor, body()), registerCustody(actor, body())]);
  const [ap, bp] = await Promise.all([savePhoto(actor, a.record.id, image), savePhoto(actor, b.record.id, image)]);
  const result = await Promise.allSettled([storeCustody(actor, a.record.id, { location: "A-0", photoAsset: ap.assetId, physicalAcceptance: true, itemsVerified: true }), storeCustody(actor, b.record.id, { location: "A-0", photoAsset: bp.assetId, physicalAcceptance: true, itemsVerified: true })]);
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(await CustodyModel.countDocuments({ location: "A-0", state: "STORED" }), 1);
});
test("storage requires actual photo, explicit inspection and known bin", async () => {
  const created = await registerCustody(actor, body());
  await assert.rejects(storeCustody(actor, created.record.id, { location: "A-1", photoAsset: randomUUID(), physicalAcceptance: true, itemsVerified: true }), { code: "PHOTO" });
  const photo = await savePhoto(actor, created.record.id, image);
  await assert.rejects(storeCustody(actor, created.record.id, { location: "unknown", photoAsset: photo.assetId, physicalAcceptance: true, itemsVerified: true }), { code: "LOCATION" });
});
test("public receipt omits photos, bins, secrets, phone and audit; view token cannot release", async () => {
  const created = await stored("A-2"); const viewToken = created.receiptPath.split("#")[1];
  const receipt = await publicReceipt(viewToken);
  assert.equal(receipt.state, "STORED");
  assert.equal("photoPath" in receipt, false); assert.equal("location" in receipt, false); assert.equal("collectionHash" in receipt, false);
  assert.ok(!JSON.stringify(receipt).includes("9999999994"));
  await assert.rejects(returnCustody(actor, created.record.id, returning(viewToken)), { code: "COLLECTION" });
  const release = returning(created.collectionCode); await returnCustody(actor, created.record.id, release);
  assert.equal((await publicReceipt(viewToken)).state, "RETURNED");
  assert.equal((await returnCustody(actor, created.record.id, release)).replayed, true);
});
test("concurrent returns make exactly one new transition and one return outbox per recipient", async () => {
  const created = await stored("A-3");
  const result = await Promise.allSettled(Array.from({ length: 10 }, () => returnCustody(actor, created.record.id, returning(created.collectionCode))));
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  const doc = await CustodyModel.findById(created.record.id).lean();
  assert.equal(doc!.events.filter((e) => e.action === "RETURNED").length, 1);
  assert.equal(doc!.outbox.filter((j) => j.event === "returned").length, 2);
  await assert.rejects(storeCustody(actor, created.record.id, { location: "A-3", photoAsset: doc!.photoAsset, physicalAcceptance: true, itemsVerified: true }), { code: "STATE" });
});
test("lost-coupon replacement requires manager; invalidates old code", async () => {
  const created = await stored("A-4"); const replacement = { action: "replace", reason: "Printed coupon lost during visit", verification: "Two item details and partial contact checked in person" };
  await assert.rejects(managerAction(actor, created.record.id, replacement), { status: 403 });
  const result = await managerAction(manager, created.record.id, replacement);
  await assert.rejects(returnCustody(actor, created.record.id, returning(created.collectionCode)), { code: "COLLECTION" });
  assert.ok(result.collectionCode); await returnCustody(actor, created.record.id, returning(result.collectionCode!));
});
test("fee tampering, invalid state transitions and manager-only waivers rejected", async () => {
  await assert.rejects(registerCustody(actor, { ...body(), amountPaise: 1 }));
  const created = await registerCustody(actor, body());
  assert.equal(created.record.amountPaise, 500);
  await assert.rejects(returnCustody(actor, created.record.id, returning(created.collectionCode)), { status: 409 });
  await assert.rejects(managerAction(actor, created.record.id, { action: "payment", state: "waived", method: "manual", reference: "TEST", reason: "Attempted waiver" }), { status: 403 });
});
test("private photos require assigned venue; reject spoofed files, strip metadata", async () => {
  const created = await registerCustody(actor, body()); const saved = await savePhoto(actor, created.record.id, image);
  await assert.rejects(readPhoto(foreign, saved.assetId), { status: 404 });
  const loaded = await readPhoto(actor, saved.assetId);
  assert.equal((await sharp(loaded.bytes).metadata()).exif, undefined);
  await assert.rejects(sanitizePhoto(Buffer.from("<svg><script>alert(1)</script></svg>")), { status: 400 });
  await assert.rejects(sanitizePhoto(Buffer.alloc(5 * 1024 * 1024 + 1)), { status: 413 });
});
test("notification failure does not erase custody; retries bounded and callbacks monotonic", async () => {
  const created = await stored("A-5");
  await CustodyModel.updateMany({}, { $set: { "outbox.$[].nextAttemptAt": new Date(Date.now() + 86_400_000) } });
  await CustodyModel.updateOne({ _id: created.record.id }, { $set: { "outbox.$[].nextAttemptAt": new Date(0) } });
  const fail = Object.assign(new Error("Synthetic provider rejection"), { retryable: true });
  await drainNotifications(async () => { throw fail; }, 2);
  let record = await CustodyModel.findById(created.record.id).lean();
  assert.equal(record!.state, "STORED"); assert.equal(record!.outbox[0].attempts, 1); assert.equal(record!.outbox[0].state, "pending");
  await CustodyModel.updateOne({ _id: created.record.id }, { $set: { "outbox.$[].nextAttemptAt": new Date(0) } });
  let count = 0;
  await Promise.all([drainNotifications(async () => ({ sid: `SM${String(++count).padStart(32, "0")}`, state: "queued" }), 2), drainNotifications(async () => ({ sid: `SM${String(++count).padStart(32, "0")}`, state: "queued" }), 2)]);
  assert.equal(count, 2);
  record = await CustodyModel.findById(created.record.id).lean(); const sid = record!.outbox[0].sid!;
  await applyDelivery(sid, "delivered"); await applyDelivery(sid, "sent"); await applyDelivery(sid, "delivered");
  assert.equal((await CustodyModel.findById(created.record.id).lean())!.outbox[0].state, "delivered");
  assert.equal(messageState("read", "failed"), "read");
});
test("opt-outs stop queued sends and unconfigured provider is visible", async () => {
  const created = await stored("A-6");
  await OptOutModel.create({ _id: hash("+919999999994"), at: new Date() });
  await drainNotifications(undefined, 20);
  const doc = await CustodyModel.findById(created.record.id).lean();
  assert.ok(doc!.outbox.some((j) => j.state === "opted_out"));
  assert.ok(doc!.outbox.some((j) => j.state === "not_configured"));
});
test("signed webhook verification rejects forged signatures and replay is idempotent", async () => {
  process.env.TWILIO_AUTH_TOKEN = "synthetic-no-live-account";
  const path = "/api/pilot/notifications/status", params = { MessageSid: `SM${"a".repeat(32)}`, MessageStatus: "read" };
  const signature = Twilio.getExpectedTwilioSignature(process.env.TWILIO_AUTH_TOKEN, `${process.env.NEXT_PUBLIC_APP_URL}${path}`, params);
  verifyTwilio(new Request(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, { headers: { "x-twilio-signature": signature } }), params, path);
  assert.throws(() => verifyTwilio(new Request(`${process.env.NEXT_PUBLIC_APP_URL}${path}`), params, path), { status: 403 });
  await applyDelivery(params.MessageSid, "read"); await applyDelivery(params.MessageSid, "read");
  delete process.env.TWILIO_AUTH_TOKEN;
});
test("staff invitation requires matching verified phone; revocation prevents further use", async () => {
  const invitation = await staffAction(manager, { action: "invite", name: "Synthetic Invite", phone: "9999999996", role: "operator" });
  await assert.rejects(acceptInvite(invitation.inviteToken!, "+919999999997"), { status: 403 });
  const staff = await acceptInvite(invitation.inviteToken!, "+919999999996");
  await staffAction(manager, { action: "revoke", operatorId: staff._id.toString() });
  await assert.rejects(authorize({ operatorId: staff._id.toString(), venueId: manager.venueId, phone: staff.phone, name: staff.name, role: staff.role }), { status: 401 });
});
test("rate limits are durable and CSV escapes spreadsheet formulas", async () => {
  await limit("test", "synthetic", 1); await assert.rejects(limit("test", "synthetic", 1), { status: 429 });
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell("normal,comma"), '"normal,comma"');
});
test("Mongo records survive a client disconnect and reconnect", async () => {
  const created = await registerCustody(actor, body()); await mongoose.disconnect();
  global.mongooseCache = undefined;
  await mongoose.connect(process.env.MONGODB_URI!);
  assert.equal((await CustodyModel.findById(created.record.id).lean())!.visitorName, "Synthetic Visitor");
});
test("large or malformed JSON rejected before business logic", async () => {
  await assert.rejects(jsonBody(new Request("https://example.test", { method: "POST", body: "invalid" })), { status: 400 });
  await assert.rejects(jsonBody(new Request("https://example.test", { method: "POST", body: "x".repeat(100) }), 10), { status: 413 });
});
test("missing production configuration and demo-production mixing fail closed", async () => {
  const saved = process.env.TOKEN_SECRET; delete process.env.TOKEN_SECRET;
  assert.throws(() => token("any", "view"), { status: 503 }); process.env.TOKEN_SECRET = saved;
  const { isDemoMode } = await import("@/lib/demo-mode");
  process.env.DEMO_MODE = "true"; assert.throws(() => isDemoMode()); process.env.DEMO_MODE = "false";
});

test("opaque sessions expire, reflect current roles and are deleted on staff revocation", async () => {
  const invited = await staffAction(manager, { action: "invite", name: "Synthetic Session Staff", phone: "9999999981", role: "admin" });
  const member = await acceptInvite(invited.inviteToken!, "+919999999981");
  const raw = randomBytes(32).toString("base64url");
  const identity = { operatorId: member._id.toString(), venueId: manager.venueId, phone: member.phone, name: member.name, role: "admin" };
  await SessionModel.create({ _id: hash(raw), ...identity, expiresAt: new Date(Date.now() + 60_000) });
  assert.equal((await resolveSession(raw))!.role, "admin");
  assert.equal(isPlatformAdmin(await resolveSession(raw)), false);
  await OperatorModel.updateOne({ _id: member._id }, { role: "operator" });
  assert.equal((await resolveSession(raw))!.role, "operator");
  await staffAction(manager, { action: "revoke", operatorId: member._id.toString() });
  assert.equal(await SessionModel.countDocuments({ operatorId: member._id.toString() }), 0);
  assert.equal(await resolveSession(raw), null);
  const expired = randomBytes(32).toString("base64url");
  await SessionModel.create({ _id: hash(expired), ...manager, expiresAt: new Date(0) });
  assert.equal(await resolveSession(expired), null);
  assert.equal(await resolveSession("forged-cookie"), null);
});

test("staff invitation is single-use under concurrent requests", async () => {
  const invitation = await staffAction(manager, { action: "invite", name: "Synthetic Race Staff", phone: "9999999982", role: "operator" });
  const results = await Promise.allSettled(Array.from({ length: 8 }, () => acceptInvite(invitation.inviteToken!, "+919999999982")));
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(await OperatorModel.countDocuments({ phone: "+919999999982", isActive: true }), 1);
  await assert.rejects(acceptInvite(invitation.inviteToken!, "+919999999982"));
});

test("concurrent invitations cannot bind one phone to two venues", async () => {
  await OperatorModel.updateOne({ _id: foreign.operatorId }, { role: "admin" });
  try {
    const a = await staffAction(manager, { action: "invite", name: "Synthetic Binding Staff", phone: "9999999983", role: "operator" });
    const b = await staffAction(foreign, { action: "invite", name: "Synthetic Binding Staff", phone: "9999999983", role: "operator" });
    const results = await Promise.allSettled([acceptInvite(a.inviteToken!, "+919999999983"), acceptInvite(b.inviteToken!, "+919999999983")]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(await OperatorModel.countDocuments({ phone: "+919999999983", isActive: true }), 1);
  } finally { await OperatorModel.updateOne({ _id: foreign.operatorId }, { role: "operator" }); }
});

test("platform admin requires an allowlist and non-replayed authenticator code", async () => {
  process.env.PLATFORM_ADMIN_PHONES = "+919999999980";
  process.env.PLATFORM_ADMIN_TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
  const now = Date.now();
  const totp = new TOTP({ secret: Secret.fromBase32(process.env.PLATFORM_ADMIN_TOTP_SECRET), algorithm: "SHA1", digits: 6, period: 30 });
  const code = totp.generate({ timestamp: now });
  await platformFactor("+919999999980", code, now);
  await assert.rejects(platformFactor("+919999999980", code, now), { code: "MFA_REPLAY" });
  await assert.rejects(platformFactor("+919999999980", "invalid", now), { code: "MFA" });
  assert.equal(isPlatformAdmin(manager), false);
  assert.equal(isPlatformAdmin({ ...manager, platformAdmin: true }), false);
  await assert.rejects(authorize({ ...manager, platformAdmin: true }), { status: 403 });
  delete process.env.PLATFORM_ADMIN_TOTP_SECRET; delete process.env.PLATFORM_ADMIN_PHONES;
});

test("receipt secrets have 256-bit nonces, separate purposes and fragment-only view URLs", async () => {
  const created = await registerCustody(actor, body());
  const doc = (await CustodyModel.findById(created.record.id).lean())!;
  assert.equal(Buffer.from(doc.nonce, "base64url").length, 32);
  const access = created.receiptPath.split("#")[1];
  assert.match(access, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(access, created.collectionCode);
  assert.equal(new URL(created.receiptPath, "https://pilot.example.test").pathname, "/pilot/receipt");
  assert.equal(new URL(created.receiptPath, "https://pilot.example.test").search, "");
  assert.equal(doc.receiptHash, hash(access));
  assert.equal(doc.collectionHash, hash(created.collectionCode));
  assert.equal(JSON.stringify(created.record).includes(doc.nonce), false);
});

test("storage rejects unverified acceptance and evidence belonging to another deposit", async () => {
  const a = await registerCustody(actor, body()), b = await registerCustody(actor, body());
  const imageA = await savePhoto(actor, a.record.id, image);
  await assert.rejects(storeCustody(actor, a.record.id, { location: "A-10", photoAsset: imageA.assetId, physicalAcceptance: false, itemsVerified: true }));
  await assert.rejects(storeCustody(actor, b.record.id, { location: "A-10", photoAsset: imageA.assetId, physicalAcceptance: true, itemsVerified: true }), { code: "PHOTO" });
  assert.equal((await CustodyModel.findById(a.record.id).lean())!.state, "REGISTERED");
});

async function isolateJobs(id: string) {
  await CustodyModel.updateMany({}, { $set: { "outbox.$[].nextAttemptAt": new Date(Date.now() + 86_400_000) } });
  await CustodyModel.updateOne({ _id: id }, { $set: { "outbox.$[].nextAttemptAt": new Date(0) } });
}

test("notification retries stop after four attempts; crash/timeout never blindly resends", async () => {
  await OptOutModel.deleteMany({});
  const created = await stored("A-11");
  await isolateJobs(created.record.id);
  let sends = 0;
  const rejected = Object.assign(new Error("Synthetic throttling"), { status: 429 });
  for (let attempt = 0; attempt < 6; attempt++) {
    await drainNotifications(async () => { sends++; throw rejected; }, 2);
    await CustodyModel.updateOne({ _id: created.record.id }, { $set: { "outbox.$[].nextAttemptAt": new Date(0) } });
  }
  assert.equal(sends, 8);
  let record = (await CustodyModel.findById(created.record.id).lean())!;
  assert.ok(record.outbox.every((job) => job.attempts === 4 && job.state === "failed"));
  await CustodyModel.updateOne({ _id: created.record.id }, { $set: { "outbox.0.state": "processing", "outbox.0.leaseUntil": new Date(0) } });
  await drainNotifications(async () => { throw new Error("Must not resend"); });
  record = (await CustodyModel.findById(created.record.id).lean())!;
  assert.equal(record.outbox[0].state, "uncertain");
  assert.equal(record.state, "STORED");
});

test("provider callback arriving before send response retains delivered state", async () => {
  const created = await stored("A-12"); await isolateJobs(created.record.id);
  let sequence = 0;
  await drainNotifications(async () => {
    const sid = `SM${String(++sequence + 100).padStart(32, "0")}`;
    await applyDelivery(sid, "delivered");
    return { sid, state: "queued" };
  }, 2);
  const record = (await CustodyModel.findById(created.record.id).lean())!;
  assert.ok(record.outbox.every((job) => job.state === "delivered"));
});

test("photo retention holds active/registered evidence and removes eligible returned evidence", async () => {
  const registered = await registerCustody(actor, body());
  const registeredPhoto = await savePhoto(actor, registered.record.id, image);
  const active = await stored("A-13"), returned = await stored("A-14");
  await returnCustody(actor, returned.record.id, returning(returned.collectionCode));
  const ids = [registered.record.id, active.record.id, returned.record.id];
  await AssetModel.updateMany({ custodyId: { $in: ids } }, { expiresAt: new Date(0) });
  assert.equal(await purgeExpiredPhotos(), 1);
  assert.equal((await AssetModel.findById(registeredPhoto.assetId))!.deletedAt, null);
  const activePhoto = await AssetModel.findOne({ custodyId: active.record.id });
  assert.ok((await readPhoto(actor, activePhoto!._id)).bytes.length);
  const returnedPhoto = await AssetModel.findOne({ custodyId: returned.record.id });
  await assert.rejects(readPhoto(actor, returnedPhoto!._id), { status: 404 });
});

import { randomBytes, randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { z } from "zod";
import type { AuthSession } from "@/types";
import type { Custody, CustodyState, NotificationJob, VenueOperations } from "@/types/pilot";
import { connectToDatabase } from "@/lib/mongodb";
import { isDemoMode } from "@/lib/demo-mode";
import { CustodyModel, OperationsModel, AuditModel, SessionModel, InviteModel, StaffBindingModel } from "@/models/Pilot";
import { VenueModel } from "@/models/Venue";
import { OperatorModel } from "@/models/Operator";
import { AssetModel } from "@/models/PilotAsset";
import { CounterModel } from "@/models/Counter";
import { hash, idSchema, keySchema, phone, PilotError, token } from "@/lib/pilot/security";

export const itemSchema = z.object({
  name: z.string().trim().min(1).max(80), quantity: z.number().int().min(1).max(20),
  condition: z.string().trim().min(1).max(200), notes: z.string().trim().max(300).default("")
}).strict();
export const checkinSchema = z.object({
  requestKey: keySchema, visitorName: z.string().trim().min(2).max(100), visitorPhone: phone,
  guardianPhone: z.union([z.literal(""), phone]).default(""),
  visitorConsent: z.boolean().default(false), guardianConsent: z.boolean().default(false),
  items: z.array(itemSchema).min(1).max(20)
}).strict();
export const operationsSchema = z.object({
  hours: z.string().trim().min(1).max(100),
  locations: z.array(z.string().trim().min(1).max(60).transform((v) => v.toUpperCase())).min(1).max(500),
  acceptedItems: z.array(z.string().trim().min(1).max(80)).min(1).max(80),
  prohibitedItems: z.array(z.string().trim().min(1).max(80)).max(80),
  feePaise: z.number().int().min(0).max(100_000), pricingTerms: z.string().trim().min(1).max(500),
  retentionDays: z.number().int().min(1).max(90)
}).strict().refine((value) => new Set(value.locations).size === value.locations.length, "Locations must be unique");

export function requireManager(actor: AuthSession) {
  if (actor.role !== "admin") throw new PilotError(403, "ROLE", "Venue manager required / Manager ki anumati chahiye");
}

/** Checks current staff and venue status for every operation, including revoked sessions. */
export async function authorize(actor: AuthSession | null, venueId?: string, accepting = false) {
  if (!actor) throw new PilotError(401, "AUTH", "Please sign in / Login karein");
  if (actor.platformAdmin) throw new PilotError(403, "ROLE", "Platform admin cannot act as venue staff");
  if (isDemoMode()) throw new PilotError(409, "DEMO", "Pilot records are unavailable in demo mode");
  if (venueId && actor.venueId !== venueId) throw new PilotError(404, "NOT_FOUND", "Record not found");
  await connectToDatabase();
  const staff = await OperatorModel.findOne({ _id: actor.operatorId, venueId: actor.venueId, isActive: true });
  if (!staff) throw new PilotError(401, "REVOKED", "Staff access revoked");
  const venue = await VenueModel.findById(actor.venueId);
  const operations = await OperationsModel.findOne({ venueId: actor.venueId }).lean();
  if (!venue || !venue.isApproved || (operations && operations.review !== "approved")) {
    throw new PilotError(403, "VENUE", "Venue is not approved or is suspended");
  }
  if (accepting && (!operations || !operations.locations.length)) throw new PilotError(409, "CAPACITY", "Manager must configure storage locations first");
  if (accepting) {
    const indexes = await CustodyModel.collection.indexes().catch(() => []);
    if (!indexes.some((index) => index.unique && index.key.venueId === 1 && index.key.location === 1 && index.partialFilterExpression?.state === "STORED")) throw new PilotError(503, "INDEXES", "Pilot allocation index is missing. Run the reviewed index setup before accepting deposits");
  }
  return { actor: { ...actor, role: staff.role } as AuthSession, venue, operations };
}

export function receiptCredentials(record: Custody) {
  const access = token(record.nonce, "view");
  return { receiptPath: `/pilot/receipt#${access}`, collectionCode: token(record.nonce, `collect:${record.collectionVersion}`) };
}

export function custodyView(record: Custody) {
  return {
    id: record._id, venueId: record.venueId, receiptNumber: record.receiptNumber,
    visitorName: record.visitorName, visitorPhone: `${record.visitorPhone.slice(0, 3)}******${record.visitorPhone.slice(-2)}`,
    guardianPhone: record.guardianPhone ? `${record.guardianPhone.slice(0, 3)}******${record.guardianPhone.slice(-2)}` : "",
    items: record.items, state: record.state, location: record.location, createdAt: record.createdAt,
    storedAt: record.storedAt, returnedAt: record.returnedAt, amountPaise: record.amountPaise,
    paymentState: record.paymentState, paymentMethod: record.paymentMethod, pricingTerms: record.pricingTerms,
    incident: record.incident, photoPath: record.photoAsset ? `/api/pilot/assets/${record.photoAsset}` : undefined,
    events: record.events, notifications: record.outbox.map(({ audience, event, state, attempts, errorCode }) => ({ audience, event, state, attempts, errorCode }))
  };
}

function jobs(record: Custody, event: "stored" | "returned"): NotificationJob[] {
  const now = new Date();
  return ([
    [record.visitorPhone, "visitor", record.visitorConsent],
    [record.guardianPhone, "guardian", record.guardianConsent]
  ] as const).filter(([recipient, , consent]) => recipient && consent).map(([recipient, audience]) => ({
    id: randomUUID(), recipient, audience, event, state: "pending", attempts: 0, nextAttemptAt: now, updatedAt: now
  }));
}

export async function registerCustody(actor: AuthSession, input: unknown) {
  const body = checkinSchema.parse(input);
  const { operations } = await authorize(actor, undefined, true);
  const requestHash = hash(JSON.stringify(body));
  const existing = await CustodyModel.findOne({ venueId: actor.venueId, requestKey: body.requestKey }).lean();
  if (existing) {
    if (existing.requestHash !== requestHash) throw new PilotError(409, "IDEMPOTENCY", "Request key was already used with different details");
    return { record: custodyView(existing), ...receiptCredentials(existing), replayed: true };
  }
  const prohibited = new Set(operations!.prohibitedItems.map((value) => value.toLowerCase()));
  if (body.items.some((item) => prohibited.has(item.name.toLowerCase()))) throw new PilotError(400, "PROHIBITED", "A selected item is prohibited at this venue");
  const sequence = await CounterModel.findOneAndUpdate({ _id: "pilot-receipt" }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  const nonce = randomBytes(32).toString("base64url");
  const now = new Date();
  const record: Custody = {
    _id: randomUUID(), venueId: actor.venueId, receiptNumber: `ST-P-${String(sequence.seq).padStart(8, "0")}`,
    ...body, requestHash, nonce, receiptHash: hash(token(nonce, "view")), collectionHash: hash(token(nonce, "collect:1")),
    collectionVersion: 1, consentAt: now, state: "REGISTERED", createdAt: now,
    amountPaise: operations!.feePaise, pricingTerms: operations!.pricingTerms, paymentState: "pending", paymentMethod: "cash",
    incident: "", events: [{ action: "REGISTERED", actor: actor.operatorId, at: now, reason: "Visitor registered; physical custody not yet accepted" }], outbox: []
  };
  try { await CustodyModel.create(record); }
  catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    return registerCustody(actor, body);
  }
  return { record: custodyView(record), ...receiptCredentials(record), replayed: false };
}

export async function findCustody(actor: AuthSession, id: string) {
  await authorize(actor);
  idSchema.parse(id);
  const record = await CustodyModel.findOne({ venueId: actor.venueId, $or: [{ _id: id }, { receiptNumber: id }] }).lean();
  if (!record) throw new PilotError(404, "NOT_FOUND", "Deposit not found for your venue");
  return record;
}

export async function storeCustody(actor: AuthSession, id: string, input: unknown) {
  const body = z.object({ location: z.string().min(1).max(60), photoAsset: z.string().uuid(), physicalAcceptance: z.literal(true), itemsVerified: z.literal(true) }).strict().parse(input);
  const { operations } = await authorize(actor, undefined, true);
  const record = await findCustody(actor, id);
  if (record.state === "STORED" && record.location === body.location && record.photoAsset === body.photoAsset) return custodyView(record);
  if (record.state !== "REGISTERED") throw new PilotError(409, "STATE", "Only registered deposits can be stored");
  if (!operations!.locations.includes(body.location)) throw new PilotError(400, "LOCATION", "Unknown physical storage location");
  const asset = await AssetModel.exists({ _id: body.photoAsset, venueId: actor.venueId, custodyId: record._id, deletedAt: null });
  if (!asset) throw new PilotError(400, "PHOTO", "A private item photo for this deposit is required");
  try {
    const updated = await CustodyModel.findOneAndUpdate({ _id: record._id, venueId: actor.venueId, state: "REGISTERED" }, {
      $set: { state: "STORED", location: body.location, photoAsset: body.photoAsset, acceptedBy: actor.operatorId, storedAt: new Date() },
      $push: { events: { action: "STORED", actor: actor.operatorId, at: new Date(), reason: "Photo and actual items verified; physically accepted" }, outbox: { $each: jobs(record, "stored") } }
    }, { new: true }).lean();
    if (!updated) throw new PilotError(409, "STATE", "Deposit changed. Refresh before continuing");
    return custodyView(updated);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new PilotError(409, "CAPACITY", "Location occupied. Choose another rack/bin");
    throw error;
  }
}

export async function returnCustody(actor: AuthSession, id: string, input: unknown) {
  const body = z.object({ requestKey: keySchema, collectionCode: z.string().min(1).max(100), physicalHandover: z.literal(true), itemsVerified: z.literal(true) }).strict().parse(input);
  const record = await findCustody(actor, id);
  // A lost-response retry is a replay, not another successful handover.
  if (record.state === "RETURNED" && record.returnRequestKey === body.requestKey && record.returnedBy === actor.operatorId) return { record: custodyView(record), replayed: true };
  if (record.state !== "STORED") throw new PilotError(409, "ALREADY_RETURNED_OR_NOT_STORED", "Already returned or not stored / Dobara return nahi ho sakta");
  if (record.incident) throw new PilotError(409, "INCIDENT", "Manager must resolve the open incident first");
  if (record.paymentState === "pending") throw new PilotError(409, "PAYMENT_PENDING", "Record payment or manager waiver before return");
  const updated = await CustodyModel.findOneAndUpdate({
    _id: record._id, venueId: actor.venueId, state: "STORED", collectionHash: hash(body.collectionCode), incident: "",
    paymentState: { $in: ["paid", "waived", "refunded"] }
  }, {
    $set: { state: "RETURNED", collectionHash: "", returnedBy: actor.operatorId, returnedAt: new Date(), returnRequestKey: body.requestKey },
    $push: { events: { action: "RETURNED", actor: actor.operatorId, at: new Date(), reason: "Collection coupon and item/photo/condition comparison verified; physical handover confirmed" }, outbox: { $each: jobs(record, "returned") } }
  }, { new: true }).lean();
  if (!updated) throw new PilotError(409, "COLLECTION", "Invalid, replaced or already-used collection code");
  return { record: custodyView(updated), replayed: false };
}

export async function managerAction(actor: AuthSession, id: string, input: unknown) {
  const { actor: currentActor } = await authorize(actor);
  const body = z.discriminatedUnion("action", [
    z.object({ action: z.literal("replace"), reason: z.string().trim().min(15).max(500), verification: z.string().trim().min(15).max(500) }),
    z.object({ action: z.literal("payment"), state: z.enum(["paid", "waived", "refunded"]), method: z.enum(["cash", "manual"]), reference: z.string().trim().min(3).max(100), reason: z.string().trim().min(5).max(500) }),
    z.object({ action: z.literal("resolve"), reason: z.string().trim().min(10).max(500) })
  ]).parse(input);
  if (!(body.action === "payment" && body.state === "paid" && body.method === "cash")) requireManager(currentActor);
  const record = await findCustody(actor, id);
  if (body.action === "replace") {
    if (record.state !== "STORED") throw new PilotError(409, "STATE", "Replacement is available only while stored");
    const version = record.collectionVersion + 1;
    const collectionCode = token(record.nonce, `collect:${version}`);
    const updated = await CustodyModel.findOneAndUpdate({ _id: id, venueId: actor.venueId, state: "STORED", collectionVersion: record.collectionVersion }, {
      $set: { collectionVersion: version, collectionHash: hash(collectionCode) },
      $push: { events: { action: "COLLECTION_REPLACED", actor: actor.operatorId, at: new Date(), reason: `${body.reason}; verification: ${body.verification}` } }
    }, { new: true }).lean();
    if (!updated) throw new PilotError(409, "CONFLICT", "Record changed. Refresh");
    return { record: custodyView(updated), collectionCode };
  }
  if (body.action === "payment") {
    if (body.state === "refunded" && record.paymentState !== "paid") throw new PilotError(409, "PAYMENT", "Only paid fees can be refunded");
    if (body.state !== "refunded" && record.paymentState !== "pending") throw new PilotError(409, "PAYMENT", "Payment is already reconciled");
    const updated = await CustodyModel.findOneAndUpdate({ _id: id, venueId: actor.venueId, paymentState: record.paymentState }, {
      $set: { paymentState: body.state, paymentMethod: body.method, paymentReference: body.reference },
      $push: { events: { action: `PAYMENT_${body.state.toUpperCase()}`, actor: actor.operatorId, at: new Date(), reason: `${body.reason}; reference: ${body.reference}` } }
    }, { new: true }).lean();
    if (!updated) throw new PilotError(409, "CONFLICT", "Payment changed. Refresh");
    return { record: custodyView(updated) };
  }
  const updated = await CustodyModel.findOneAndUpdate({ _id: id, venueId: actor.venueId }, {
    $set: { incident: "" }, $push: { events: { action: "INCIDENT_RESOLVED", actor: actor.operatorId, at: new Date(), reason: body.reason } }
  }, { new: true }).lean();
  return { record: custodyView(updated!) };
}

export async function controlCustody(actor: AuthSession, id: string, input: unknown) {
  const body = z.object({ action: z.enum(["cancel", "incident"]), reason: z.string().trim().min(10).max(500) }).strict().parse(input);
  const record = await findCustody(actor, id);
  if (body.action === "cancel" && record.state !== "REGISTERED") throw new PilotError(409, "STATE", "Stored records cannot be cancelled");
  const updated = await CustodyModel.findOneAndUpdate({ _id: id, venueId: actor.venueId, state: record.state }, {
    $set: body.action === "cancel" ? { state: "CANCELLED", collectionHash: "" } : { incident: body.reason },
    $push: { events: { action: body.action.toUpperCase(), actor: actor.operatorId, at: new Date(), reason: body.reason } }
  }, { new: true }).lean();
  if (!updated) throw new PilotError(409, "STATE", "Record changed. Refresh");
  return custodyView(updated);
}

export async function publicReceipt(access: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(access)) throw new PilotError(404, "NOT_FOUND", "Receipt not found");
  await connectToDatabase();
  const record = await CustodyModel.findOne({ receiptHash: hash(access) }).lean();
  if (!record) throw new PilotError(404, "NOT_FOUND", "Receipt not found");
  const venue = await VenueModel.findById(record.venueId);
  const view = custodyView(record);
  // Public view deliberately excludes the private photo, exact bin, events and collection credential.
  return { receiptNumber: view.receiptNumber, visitorName: view.visitorName, visitorPhone: view.visitorPhone,
    guardianPhone: view.guardianPhone, items: view.items.map(({ name, quantity }) => ({ name, quantity })),
    state: view.state, amountPaise: view.amountPaise, pricingTerms: view.pricingTerms, paymentState: view.paymentState,
    createdAt: view.createdAt, storedAt: view.storedAt, returnedAt: view.returnedAt, notifications: view.notifications,
    venueName: venue?.name, city: venue?.city };
}

export async function saveOperations(actor: AuthSession, input: unknown) {
  const { actor: currentActor, operations } = await authorize(actor); requireManager(currentActor);
  const body = operationsSchema.parse(input);
  if (operations?.locations.some((location) => !body.locations.includes(location))) throw new PilotError(409, "CAPACITY", "During the pilot locations may be added but not removed; use supervised maintenance to retire bins");
  const occupied = await CustodyModel.distinct("location", { venueId: actor.venueId, state: "STORED" });
  if (occupied.some((location) => !body.locations.includes(location))) throw new PilotError(409, "CAPACITY", "Cannot remove an occupied location");
  await OperationsModel.findOneAndUpdate({ venueId: actor.venueId }, { ...body, review: operations?.review || "approved" }, { upsert: true });
  await AuditModel.create({ action: "OPERATIONS_UPDATED", actor: actor.operatorId, venueId: actor.venueId, at: new Date(), reason: "Storage capacity, pricing and retention configured" });
}

export async function staffAction(actor: AuthSession, input: unknown) {
  const { actor: currentActor } = await authorize(actor); requireManager(currentActor);
  const body = z.discriminatedUnion("action", [
    z.object({ action: z.literal("invite"), phone, name: z.string().min(2).max(100), role: z.enum(["operator", "admin"]) }),
    z.object({ action: z.literal("revoke"), operatorId: z.string().min(1).max(100) }),
    z.object({ action: z.literal("role"), operatorId: z.string().min(1).max(100), role: z.enum(["operator", "admin"]) })
  ]).parse(input);
  if (body.action === "invite") {
    const raw = randomBytes(32).toString("base64url");
    await InviteModel.create({ _id: hash(raw), venueId: actor.venueId, ...body, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) });
    await AuditModel.create({ action: "STAFF_INVITED", actor: actor.operatorId, venueId: actor.venueId, at: new Date(), reason: `Role ${body.role}` });
    return { inviteToken: raw };
  }
  if (body.operatorId === actor.operatorId) throw new PilotError(409, "SELF", "Ask another manager to change your access");
  const member = await OperatorModel.findOne({ _id: body.operatorId, venueId: actor.venueId });
  if (!member) throw new PilotError(404, "NOT_FOUND", "Staff member not found");
  await OperatorModel.updateOne({ _id: member._id, venueId: actor.venueId }, body.action === "revoke" ? { isActive: false } : { role: body.role });
  await SessionModel.deleteMany({ operatorId: body.operatorId });
  await AuditModel.create({ action: `STAFF_${body.action.toUpperCase()}`, actor: actor.operatorId, venueId: actor.venueId, at: new Date(), reason: "Manager access change" });
  return { success: true };
}

export async function acceptInvite(inviteToken: string, verifiedPhone: string) {
  await connectToDatabase();
  const invitation = await InviteModel.findOne({ _id: hash(inviteToken), phone: verifiedPhone, expiresAt: { $gt: new Date() } });
  if (!invitation) throw new PilotError(403, "INVITATION", "Invitation expired or phone does not match");
  const other = await OperatorModel.findOne({ phone: verifiedPhone, venueId: { $ne: invitation.venueId }, isActive: true });
  if (other) throw new PilotError(409, "VENUE", "This phone already belongs to another venue");
  const existing = await OperatorModel.findOne({ phone: verifiedPhone, venueId: invitation.venueId });
  const binding = await StaffBindingModel.findOneAndUpdate({ _id: hash(verifiedPhone) }, {
    $setOnInsert: { venueId: invitation.venueId, operatorId: existing?._id.toString() || new Types.ObjectId().toString() }
  }, { upsert: true, new: true });
  if (binding.venueId !== invitation.venueId) throw new PilotError(409, "VENUE", "Phone belongs to another venue. A supervised transfer is required");
  const consumed = await InviteModel.findOneAndDelete({ _id: invitation._id, phone: verifiedPhone, expiresAt: { $gt: new Date() } });
  if (!consumed) throw new PilotError(409, "INVITATION", "Invitation already used or expired");
  const operator = await OperatorModel.findOneAndUpdate({ _id: binding.operatorId }, {
    phone: verifiedPhone, venueId: invitation.venueId, name: invitation.name, role: invitation.role, isActive: true
  }, { upsert: true, new: true });
  await SessionModel.deleteMany({ operatorId: operator._id.toString() });
  return operator;
}

export const allowedStates: CustodyState[] = ["REGISTERED", "STORED", "RETURNED", "CANCELLED"];
export type Operations = VenueOperations;

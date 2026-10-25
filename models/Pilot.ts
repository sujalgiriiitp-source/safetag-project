import { Schema, model, models, type Model } from "mongoose";
import type { Custody, VenueOperations } from "@/types/pilot";

const event = new Schema({ action: String, actor: String, at: Date, reason: String }, { _id: false });
const job = new Schema({
  id: String, recipient: String, audience: String, event: String, state: String,
  attempts: Number, nextAttemptAt: Date, leaseUntil: Date, leaseId: String, sid: String, errorCode: String, updatedAt: Date
}, { _id: false });
const custodySchema = new Schema<Custody>({
  _id: String, venueId: { type: String, required: true, index: true }, receiptNumber: { type: String, unique: true },
  requestKey: String, requestHash: String, nonce: String, receiptHash: { type: String, unique: true },
  collectionHash: String, collectionVersion: Number,
  visitorName: String, visitorPhone: String, guardianPhone: String,
  visitorConsent: Boolean, guardianConsent: Boolean, consentAt: Date,
  items: [{ _id: false, name: String, quantity: Number, condition: String, notes: String }],
  state: { type: String, enum: ["REGISTERED", "STORED", "RETURNED", "CANCELLED"], index: true },
  location: String, photoAsset: String, createdAt: Date, storedAt: Date, returnedAt: Date,
  acceptedBy: String, returnedBy: String, returnRequestKey: String,
  amountPaise: Number, pricingTerms: String, paymentState: String, paymentMethod: String,
  paymentReference: String, incident: { type: String, default: "" }, events: [event], outbox: [job]
}, { versionKey: false });
custodySchema.index({ venueId: 1, requestKey: 1 }, { unique: true });
// One active deposit per physical location, enforced across devices by MongoDB.
custodySchema.index({ venueId: 1, location: 1 }, { unique: true, partialFilterExpression: { state: "STORED" } });
custodySchema.index({ "outbox.state": 1, "outbox.nextAttemptAt": 1 });
const operationsSchema = new Schema<VenueOperations>({
  venueId: { type: String, unique: true }, review: { type: String, default: "pending" },
  hours: String, locations: [String], acceptedItems: [String], prohibitedItems: [String],
  feePaise: Number, pricingTerms: String, retentionDays: { type: Number, default: 30 }
});
const sessionSchema = new Schema({
  _id: String, operatorId: String, venueId: String, role: String, phone: String, name: String,
  platformAdmin: Boolean, createdAt: Date, expiresAt: { type: Date, expires: 0 }
});
const rateSchema = new Schema({ _id: String, count: Number, expiresAt: { type: Date, expires: 0 } });
const grantSchema = new Schema({ _id: String, phone: String, purpose: String, expiresAt: { type: Date, expires: 0 } });
const auditSchema = new Schema({ action: String, actor: String, venueId: String, at: Date, reason: String });
const inviteSchema = new Schema({ _id: String, venueId: String, phone: String, name: String, role: String, expiresAt: Date });
const optOutSchema = new Schema({ _id: String, at: Date });
// A phone has one durable venue/operator binding, including concurrent invitation acceptance.
const staffBindingSchema = new Schema({ _id: String, venueId: String, operatorId: String });
export const CustodyModel = (models.PilotCustody as Model<Custody>) || model<Custody>("PilotCustody", custodySchema);
export const OperationsModel = (models.PilotOperations as Model<VenueOperations>) || model<VenueOperations>("PilotOperations", operationsSchema);
export const SessionModel = models.PilotSession || model("PilotSession", sessionSchema);
export const RateModel = models.PilotRate || model("PilotRate", rateSchema);
export const GrantModel = models.PilotGrant || model("PilotGrant", grantSchema);
export const AuditModel = models.PilotAudit || model("PilotAudit", auditSchema);
export const InviteModel = models.PilotInvite || model("PilotInvite", inviteSchema);
export const OptOutModel = models.PilotOptOut || model("PilotOptOut", optOutSchema);
export const StaffBindingModel = models.PilotStaffBinding || model("PilotStaffBinding", staffBindingSchema);

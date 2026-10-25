import Twilio from "twilio";
import { randomUUID } from "node:crypto";
import type { Custody, MessageState, NotificationJob } from "@/types/pilot";
import { CustodyModel, OptOutModel } from "@/models/Pilot";
import { VenueModel } from "@/models/Venue";
import { receiptCredentials } from "@/lib/pilot/custody";
import { hash, PilotError } from "@/lib/pilot/security";

export interface ProviderResult { sid: string; state: "queued" | "sent" }
export type Sender = (record: Custody, job: NotificationJob) => Promise<ProviderResult>;
export function messageState(current: MessageState, next: MessageState): MessageState {
  const rank: Partial<Record<MessageState, number>> = { pending: 0, processing: 1, queued: 2, sent: 3, failed: 4, delivered: 5, read: 6 };
  return (rank[next] ?? -1) > (rank[current] ?? -1) ? next : current;
}

export async function twilioSender(record: Custody, job: NotificationJob): Promise<ProviderResult> {
  const env = process.env;
  const sandbox = env.TWILIO_MODE === "sandbox";
  const contentSid = env[job.event === "stored" ? "TWILIO_STORED_CONTENT_SID" : "TWILIO_RETURNED_CONTENT_SID"];
  if (env.NOTIFICATIONS_ENABLED !== "true" || !env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_FROM || !env.NEXT_PUBLIC_APP_URL || (!sandbox && !contentSid)) {
    throw new PilotError(503, "NOT_CONFIGURED", "Notifications not configured");
  }
  if (sandbox && !(env.NOTIFICATION_TEST_RECIPIENTS || "").split(",").includes(job.recipient)) throw new PilotError(403, "NOT_CONFIGURED", "Sandbox recipient not authorized");
  const venue = await VenueModel.findById(record.venueId);
  const time = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(job.event === "returned" ? record.returnedAt! : record.storedAt!);
  const url = `${env.NEXT_PUBLIC_APP_URL}${receiptCredentials(record).receiptPath}`;
  const body = `SafeTag ${job.event === "stored" ? "custody confirmed / Saman jama hua" : "items returned / Saman wapas mila"}\nNamaste ${record.visitorName}\nVenue: ${venue?.name}\nItems: ${record.items.map((i) => `${i.quantity} x ${i.name}`).join(", ")}\nToken: ${record.receiptNumber}\nTime: ${time}\nReceipt: ${url}\nReply STOP to opt out.`;
  const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, { timeout: 10_000, autoRetry: false });
  const response = await client.messages.create({ from: env.TWILIO_WHATSAPP_FROM, to: `whatsapp:${job.recipient}`,
    ...(sandbox ? { body } : { contentSid, contentVariables: JSON.stringify({ "1": record.visitorName, "2": venue?.name || "SafeTag venue", "3": record.receiptNumber, "4": url, "5": time }) }),
    statusCallback: `${env.NEXT_PUBLIC_APP_URL}/api/pilot/notifications/status`
  });
  return { sid: response.sid, state: "queued" };
}

/** Each job is leased in Mongo. A crash after provider acceptance is marked uncertain, not blindly resent. */
export async function drainNotifications(sender: Sender = twilioSender, batch = 20) {
  const now = new Date();
  await CustodyModel.updateMany({ outbox: { $elemMatch: { state: "processing", leaseUntil: { $lt: now } } } }, {
    $set: { "outbox.$[job].state": "uncertain", "outbox.$[job].errorCode": "LEASE_EXPIRED_RECONCILE" }
  }, { arrayFilters: [{ "job.state": "processing", "job.leaseUntil": { $lt: now } }] });
  let processed = 0;
  for (let index = 0; index < batch; index++) {
    const leaseId = randomUUID();
    const condition = { state: "pending", nextAttemptAt: { $lte: new Date() }, attempts: { $lt: 4 } };
    const record = await CustodyModel.findOneAndUpdate({ outbox: { $elemMatch: condition } }, {
      $set: { "outbox.$.state": "processing", "outbox.$.leaseId": leaseId, "outbox.$.leaseUntil": new Date(Date.now() + 60_000), "outbox.$.updatedAt": new Date() },
      $inc: { "outbox.$.attempts": 1 }
    }, { new: true }).lean();
    if (!record) break;
    const job = record.outbox.find((entry) => entry.leaseId === leaseId);
    if (!job) continue;
    const set = async (patch: Record<string, unknown>) => {
      await CustodyModel.updateOne({ _id: record._id, outbox: { $elemMatch: { id: job.id, state: "processing" } } }, {
        $set: Object.fromEntries(Object.entries({ ...patch, updatedAt: new Date() }).map(([key, value]) => [`outbox.$.${key}`, value]))
      });
    };
    try {
      if (await OptOutModel.exists({ _id: hash(job.recipient) })) await set({ state: "opted_out" });
      else {
        const result = await sender(record, job);
        await set({ state: result.state, sid: result.sid, errorCode: "" });
        const callback = await CallbackModel.findOne({ _id: result.sid });
        if (callback) await applyDelivery(result.sid, callback.state);
      }
    } catch (error) {
      const provider = error as { status?: number; code?: string | number; retryable?: boolean };
      if (error instanceof PilotError && error.code === "NOT_CONFIGURED") await set({ state: "not_configured", errorCode: "NOT_CONFIGURED" });
      else if ((provider.status === 429 || provider.retryable) && job.attempts < 4) await set({ state: "pending", nextAttemptAt: new Date(Date.now() + 30_000 * 2 ** job.attempts), errorCode: "RETRY" });
      else await set({ state: provider.status && provider.status >= 400 && provider.status < 500 ? "failed" : "uncertain", errorCode: "PROVIDER_ERROR" });
    }
    processed++;
  }
  return { processed };
}

import { Schema, model, models } from "mongoose";
const CallbackModel = models.PilotCallback || model("PilotCallback", new Schema({ _id: String, state: String, rank: Number, at: Date }));

export async function applyDelivery(sid: string, state: MessageState) {
  const ranks: Partial<Record<MessageState, number>> = { queued: 2, sent: 3, failed: 4, delivered: 5, read: 6 };
  const rank = ranks[state]; if (!rank) return;
  // Preserve callback evidence even when it arrives before the send response is persisted.
  await CallbackModel.updateOne({ _id: sid }, { $setOnInsert: { state, rank, at: new Date() } }, { upsert: true });
  await CallbackModel.updateOne({ _id: sid, rank: { $lt: rank } }, { $set: { state, rank, at: new Date() } });
  const allowed = Object.entries(ranks).filter(([, value]) => value! < rank).map(([key]) => key);
  await CustodyModel.updateOne({ outbox: { $elemMatch: { sid, state: { $in: [...allowed, "processing"] } } } }, {
    $set: { "outbox.$.state": state, "outbox.$.updatedAt": new Date() }
  });
}

export function verifyTwilio(request: Request, params: Record<string, string>, path: string) {
  const auth = process.env.TWILIO_AUTH_TOKEN, base = process.env.NEXT_PUBLIC_APP_URL;
  if (!auth || !base || !Twilio.validateRequest(auth, request.headers.get("x-twilio-signature") || "", `${base}${path}`, params)) {
    throw new PilotError(403, "SIGNATURE", "Invalid webhook signature");
  }
}

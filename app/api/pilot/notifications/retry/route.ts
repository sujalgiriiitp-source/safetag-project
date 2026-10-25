import { z } from "zod";
import { getCurrentSession } from "@/lib/session";
import { authorize, requireManager } from "@/lib/pilot/custody";
import { assertOrigin, failure, jsonBody, PilotError } from "@/lib/pilot/security";
import { CustodyModel } from "@/models/Pilot";
export async function POST(request: Request) {
  try {
    assertOrigin(request); const { actor } = await authorize(await getCurrentSession()); requireManager(actor);
    const body = z.object({ recordId: z.string().uuid(), reason: z.string().min(10).max(500) }).strict().parse(await jsonBody(request));
    const result = await CustodyModel.updateOne({ _id: body.recordId, venueId: actor.venueId, "outbox.state": { $in: ["not_configured", "failed"] } }, {
      $set: { "outbox.$[job].state": "pending", "outbox.$[job].attempts": 0, "outbox.$[job].nextAttemptAt": new Date() },
      $push: { events: { action: "NOTIFICATION_RETRY", actor: actor.operatorId, at: new Date(), reason: body.reason } }
    }, { arrayFilters: [{ "job.state": { $in: ["not_configured", "failed"] } }] });
    if (!result.modifiedCount) throw new PilotError(409, "RETRY", "No safe retryable job. Uncertain requests require provider reconciliation");
    return Response.json({ success: true });
  } catch (error) { return failure(error); }
}

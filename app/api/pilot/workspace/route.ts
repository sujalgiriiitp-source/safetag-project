import { getCurrentSession } from "@/lib/session";
import { authorize, custodyView, allowedStates } from "@/lib/pilot/custody";
import { failure } from "@/lib/pilot/security";
import { CustodyModel } from "@/models/Pilot";
import { OperatorModel } from "@/models/Operator";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { actor, venue, operations } = await authorize(await getCurrentSession());
    const url = new URL(request.url), query: Record<string, unknown> = { venueId: actor.venueId };
    const page = Math.max(1, Math.min(10_000, Number(url.searchParams.get("page")) || 1));
    const state = url.searchParams.get("state");
    if (state && allowedStates.includes(state as typeof allowedStates[number])) query.state = state;
    const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
    if (q) { const expression = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); query.$or = ["receiptNumber", "visitorName", "visitorPhone", "location"].map((key) => ({ [key]: { $regex: expression, $options: "i" } })); }
    const [records, total, occupied, staff, grouped] = await Promise.all([
      CustodyModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * 25).limit(25).lean(),
      CustodyModel.countDocuments(query),
      CustodyModel.distinct("location", { venueId: actor.venueId, state: "STORED" }),
      actor.role === "admin" ? OperatorModel.find({ venueId: actor.venueId }).select("name phone role isActive").lean() : [],
      CustodyModel.aggregate([{ $match: { venueId: actor.venueId } }, { $group: { _id: "$state", count: { $sum: 1 }, collectedPaise: { $sum: { $cond: [{ $eq: ["$paymentState", "paid"] }, "$amountPaise", 0] } } } }])
    ]);
    return Response.json({ actor: { name: actor.name, role: actor.role, operatorId: actor.operatorId }, venue: { name: venue.name, city: venue.city },
      operations, occupied, staff, records: records.map(custodyView), page, total, stats: grouped,
      integrations: { database: "connected", storage: process.env.STORAGE_DRIVER || "mongo", ai: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
        notifications: process.env.NOTIFICATIONS_ENABLED === "true" ? "enabled: verify provider setup" : "not configured / disabled", offline: "online required" } });
  } catch (error) { return failure(error); }
}

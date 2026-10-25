import { z } from "zod";
import { getCurrentSession, isPlatformAdmin } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditModel, CustodyModel, OperationsModel, SessionModel } from "@/models/Pilot";
import { VenueModel } from "@/models/Venue";
import { assertOrigin, failure, jsonBody, PilotError } from "@/lib/pilot/security";
export const dynamic = "force-dynamic";
async function platform() {
  const actor = await getCurrentSession();
  if (!actor) throw new PilotError(401, "AUTH", "Sign in required");
  if (!isPlatformAdmin(actor)) throw new PilotError(403, "ROLE", "Platform administrator required");
  await connectToDatabase(); return actor;
}
export async function GET() {
  try {
    await platform();
    const [venues, reviews, total, jobs, audit] = await Promise.all([
      VenueModel.find({}).select("name type city state address contactName contactPhone isApproved").limit(100).lean(),
      OperationsModel.find({}).select("venueId review").limit(100).lean(), CustodyModel.countDocuments(),
      CustodyModel.aggregate([{ $unwind: "$outbox" }, { $group: { _id: "$outbox.state", count: { $sum: 1 } } }]),
      AuditModel.find({}).sort({ at: -1 }).limit(50).lean()
    ]);
    return Response.json({ venues, reviews, totalDeposits: total, jobs, audit, platformRevenue: "No commission contract or subscription receipts recorded" });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request); const actor = await platform();
    const body = z.object({ venueId: z.string().regex(/^[a-f0-9]{24}$/i), review: z.enum(["approved", "rejected", "suspended", "pending"]), reason: z.string().trim().min(10).max(500) }).strict().parse(await jsonBody(request));
    const venue = await VenueModel.findById(body.venueId); if (!venue) throw new PilotError(404, "VENUE", "Venue not found");
    // Review ledger is the authority; a legacy isApproved flag alone never makes a public partner.
    await OperationsModel.updateOne({ venueId: body.venueId }, { $set: { review: body.review }, $setOnInsert: {
      locations: [], acceptedItems: venue.customItemCategories || [], prohibitedItems: [], hours: venue.operatingHours || "Manager must configure",
      feePaise: 0, pricingTerms: "Manager must confirm pricing before accepting deposits", retentionDays: 30
    } }, { upsert: true });
    await VenueModel.updateOne({ _id: body.venueId }, { isApproved: body.review === "approved" });
    if (body.review !== "approved") await SessionModel.deleteMany({ venueId: body.venueId });
    await AuditModel.create({ action: `VENUE_${body.review.toUpperCase()}`, actor: actor.operatorId, venueId: body.venueId, at: new Date(), reason: body.reason });
    return Response.json({ success: true });
  } catch (error) { return failure(error); }
}

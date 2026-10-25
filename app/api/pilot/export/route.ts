import { getCurrentSession } from "@/lib/session";
import { authorize, requireManager } from "@/lib/pilot/custody";
import { csvCell, failure } from "@/lib/pilot/security";
import { AuditModel, CustodyModel } from "@/models/Pilot";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { actor } = await authorize(await getCurrentSession()); requireManager(actor);
    const page = Math.max(1, Math.min(10_000, Number(new URL(request.url).searchParams.get("page")) || 1));
    const records = await CustodyModel.find({ venueId: actor.venueId }).sort({ createdAt: -1 }).skip((page - 1) * 500).limit(500).lean();
    const rows = [["Receipt", "Visitor", "State", "Location", "Amount INR", "Payment", "Check-in"], ...records.map((r) => [r.receiptNumber, r.visitorName, r.state, r.location, r.amountPaise / 100, r.paymentState, r.createdAt.toISOString()])];
    await AuditModel.create({ action: "CSV_EXPORT", actor: actor.operatorId, venueId: actor.venueId, at: new Date(), reason: `Page ${page}, ${records.length} rows` });
    return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="safetag-page-${page}.csv"`, "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

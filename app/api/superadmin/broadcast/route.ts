import { getCurrentSession, isPlatformAdmin } from "@/lib/session";
import { failure } from "@/lib/pilot/security";
export async function POST() {
  try {
    const actor = await getCurrentSession();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!isPlatformAdmin(actor)) return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ error: "Bulk messaging requires recorded opt-in and an approved campaign template. Transactional pilot notifications are available in the outbox." }, { status: 409 });
  } catch (error) { return failure(error); }
}

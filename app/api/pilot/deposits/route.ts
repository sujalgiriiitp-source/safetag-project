import { getCurrentSession } from "@/lib/session";
import { registerCustody, authorize } from "@/lib/pilot/custody";
import { assertOrigin, failure, jsonBody, limit } from "@/lib/pilot/security";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { actor } = await authorize(await getCurrentSession());
    await limit("checkin", actor.operatorId, 60);
    return Response.json(await registerCustody(actor, await jsonBody(request)), { status: 201 });
  } catch (error) { return failure(error); }
}

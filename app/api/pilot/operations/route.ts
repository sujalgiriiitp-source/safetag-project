import { getCurrentSession } from "@/lib/session";
import { authorize, saveOperations } from "@/lib/pilot/custody";
import { assertOrigin, failure, jsonBody } from "@/lib/pilot/security";
export async function POST(request: Request) {
  try {
    assertOrigin(request); const { actor } = await authorize(await getCurrentSession());
    await saveOperations(actor, await jsonBody(request)); return Response.json({ success: true });
  } catch (error) { return failure(error); }
}

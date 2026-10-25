import { getCurrentSession } from "@/lib/session";
import { authorize, staffAction } from "@/lib/pilot/custody";
import { assertOrigin, failure, jsonBody } from "@/lib/pilot/security";
export async function POST(request: Request) {
  try {
    assertOrigin(request); const { actor } = await authorize(await getCurrentSession());
    return Response.json(await staffAction(actor, await jsonBody(request)));
  } catch (error) { return failure(error); }
}

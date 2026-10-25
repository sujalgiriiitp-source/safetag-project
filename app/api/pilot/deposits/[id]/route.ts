import { getCurrentSession } from "@/lib/session";
import { authorize, controlCustody, custodyView, findCustody, managerAction, receiptCredentials, returnCustody, storeCustody } from "@/lib/pilot/custody";
import { assertOrigin, failure, jsonBody, limit, PilotError } from "@/lib/pilot/security";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    const { actor } = await authorize(await getCurrentSession());
    const record = await findCustody(actor, (await params).id);
    return Response.json({ record: custodyView(record), receiptPath: receiptCredentials(record).receiptPath });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request, { params }: Context) {
  try {
    assertOrigin(request);
    const { actor } = await authorize(await getCurrentSession());
    await limit("custody-action", actor.operatorId, 30);
    const id = (await params).id, { action, ...body } = await jsonBody(request);
    if (action === "store") return Response.json({ record: await storeCustody(actor, id, body) });
    if (action === "return") return Response.json(await returnCustody(actor, id, body));
    if (["replace", "payment", "resolve"].includes(action)) return Response.json(await managerAction(actor, id, { action, ...body }));
    if (["cancel", "incident"].includes(action)) return Response.json({ record: await controlCustody(actor, id, { action, ...body }) });
    throw new PilotError(400, "ACTION", "Unknown custody action");
  } catch (error) { return failure(error); }
}

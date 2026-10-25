import { z } from "zod";
import { getCurrentSession } from "@/lib/session";
import { authorize } from "@/lib/pilot/custody";
import { savePhoto } from "@/lib/pilot/media";
import { assertOrigin, failure, jsonBody, limit } from "@/lib/pilot/security";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { actor } = await authorize(await getCurrentSession());
    await limit("upload", actor.operatorId, 20);
    const body = z.object({ custodyId: z.string().uuid(), imageBase64: z.string().max(7_000_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/) }).strict().parse(await jsonBody(request, 7_100_000));
    return Response.json(await savePhoto(actor, body.custodyId, Buffer.from(body.imageBase64.split(",")[1], "base64")), { status: 201 });
  } catch (error) { return failure(error); }
}

import { getCurrentSession } from "@/lib/session";
import { readPhoto } from "@/lib/pilot/media";
import { failure, PilotError } from "@/lib/pilot/security";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getCurrentSession(); if (!actor) throw new PilotError(401, "AUTH", "Sign in required");
    const image = await readPhoto(actor, (await params).id);
    return new Response(new Uint8Array(image.bytes), { headers: { "Content-Type": image.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return failure(error); }
}

import { clearSessionCookie } from "@/lib/session";
import { assertOrigin, failure } from "@/lib/pilot/security";
export async function POST(request: Request) {
  try { assertOrigin(request); await clearSessionCookie(); return Response.json({ success: true }); }
  catch (error) { return failure(error); }
}

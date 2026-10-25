import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { applyDelivery, verifyTwilio } from "@/lib/pilot/notifications";
import { boundedText, failure } from "@/lib/pilot/security";
export async function POST(request: Request) {
  try {
    const params = Object.fromEntries(new URLSearchParams(await boundedText(request)));
    verifyTwilio(request, params, "/api/pilot/notifications/status");
    const status = params.MessageStatus === "undelivered" ? "failed" : params.MessageStatus;
    const state = z.enum(["queued", "sent", "delivered", "read", "failed"]).parse(status);
    const sid = z.string().regex(/^SM[a-fA-F0-9]{32}$/).parse(params.MessageSid);
    await connectToDatabase(); await applyDelivery(sid, state);
    return Response.json({ success: true });
  } catch (error) { return failure(error); }
}

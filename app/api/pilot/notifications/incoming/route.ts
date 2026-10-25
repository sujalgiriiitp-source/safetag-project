import { connectToDatabase } from "@/lib/mongodb";
import { verifyTwilio } from "@/lib/pilot/notifications";
import { boundedText, failure, hash, phone } from "@/lib/pilot/security";
import { OptOutModel } from "@/models/Pilot";
export async function POST(request: Request) {
  try {
    const params = Object.fromEntries(new URLSearchParams(await boundedText(request)));
    verifyTwilio(request, params, "/api/pilot/notifications/incoming");
    const number = phone.parse(params.From || "");
    await connectToDatabase();
    if (["STOP", "UNSUBSCRIBE", "CANCEL"].includes((params.Body || "").trim().toUpperCase())) await OptOutModel.updateOne({ _id: hash(number) }, { at: new Date() }, { upsert: true });
    return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
  } catch (error) { return failure(error); }
}

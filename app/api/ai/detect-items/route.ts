import { NextRequest, NextResponse } from "next/server";
import { detectItemsFromImage } from "@/lib/vision";
import { getCurrentSession } from "@/lib/session";
import { authorize } from "@/lib/pilot/custody";
import { failure, jsonBody, limit } from "@/lib/pilot/security";
import { sanitizePhoto } from "@/lib/pilot/media";
import { isDemoMode } from "@/lib/demo-mode";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    if (!isDemoMode()) { await authorize(session); await limit("ai", session.operatorId, 10); }
    const { imageBase64, fileName, venueType } = await jsonBody(request, 7_100_000);
    if (!venueType) {
      return NextResponse.json({ error: "Venue type is required." }, { status: 400 });
    }

    if (!isDemoMode() && !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) return NextResponse.json({ detectedItems: [], source: "unavailable", warning: "AI unavailable. Select items manually / Items manually chunein" });
    const bytes = await sanitizePhoto(Buffer.from(String(imageBase64).split(",")[1] || "", "base64"));
    const detectedItems = await detectItemsFromImage(`data:image/jpeg;base64,${bytes.toString("base64")}`, fileName, venueType);
    return NextResponse.json({ detectedItems, source: isDemoMode() ? "demo-filename" : "google-vision", warning: "Suggestions only. Operator must inspect and confirm actual items." });
  } catch (error) {
    return failure(error);
  }
}

import { connectToDatabase } from "@/lib/mongodb";
import { drainNotifications } from "@/lib/pilot/notifications";
import { purgeExpiredPhotos } from "@/lib/pilot/media";
import { failure, PilotError, safeEqual } from "@/lib/pilot/security";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    if (!process.env.CRON_SECRET || !safeEqual(request.headers.get("authorization") || "", `Bearer ${process.env.CRON_SECRET}`)) throw new PilotError(401, "AUTH", "Unauthorized worker");
    await connectToDatabase();
    const result = await drainNotifications(); const deletedPhotos = await purgeExpiredPhotos();
    return Response.json({ ...result, deletedPhotos });
  } catch (error) { return failure(error); }
}

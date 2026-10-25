import { connectToDatabase } from "@/lib/mongodb";
import { secret } from "@/lib/pilot/security";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    secret(); await connectToDatabase();
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("Configuration incomplete");
    return Response.json({ status: "ok", database: "connected" });
  } catch { return Response.json({ status: "not_ready" }, { status: 503 }); }
}

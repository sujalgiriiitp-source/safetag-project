import { getPublicStats } from "@/lib/repository";

export async function GET() {
  try {
    const stats = await getPublicStats();
    return Response.json(stats);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

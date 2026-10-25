import { getApprovedPublicVenues } from "@/lib/repository";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const venues = await getApprovedPublicVenues();
    return Response.json({ venues });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

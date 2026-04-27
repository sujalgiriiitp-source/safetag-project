import { getWaitlistCount } from "@/lib/repository";

export async function GET() {
  try {
    const count = await getWaitlistCount();
    return Response.json({ count });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

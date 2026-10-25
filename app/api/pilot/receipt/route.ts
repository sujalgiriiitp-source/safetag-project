import { cookies } from "next/headers";
import { publicReceipt } from "@/lib/pilot/custody";
import { assertOrigin, failure, jsonBody } from "@/lib/pilot/security";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { access } = z.object({ access: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).parse(await jsonBody(request, 1024));
    const receipt = await publicReceipt(access);
    (await cookies()).set("safetag-receipt", access, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/api/pilot/receipt", maxAge: 7 * 86_400 });
    return Response.json(receipt);
  } catch (error) { return failure(error); }
}
export async function GET() {
  try { return Response.json(await publicReceipt((await cookies()).get("safetag-receipt")?.value || "")); }
  catch (error) { return failure(error); }
}

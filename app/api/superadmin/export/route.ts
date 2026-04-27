import { NextResponse } from "next/server";
import { getDeposits, getVenues } from "@/lib/repository";

export async function GET() {
  try {
    const [venues, deposits] = await Promise.all([getVenues(), getDeposits()]);

    const lines = [
      "type,name,city,status,tokenId,visitorName,visitorPhone,items",
      ...deposits.map((deposit) => {
        const venue = venues.find((item) => item._id === deposit.venueId);
        return [
          venue?.type ?? "",
          venue?.name ?? "",
          venue?.city ?? "",
          deposit.status,
          deposit.tokenId,
          deposit.visitorName,
          deposit.visitorPhone,
          `"${deposit.itemsList.join("|")}"`
        ].join(",");
      })
    ];

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="safetag-platform-export.csv"'
      }
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

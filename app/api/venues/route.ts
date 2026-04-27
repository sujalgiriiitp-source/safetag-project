import { NextRequest, NextResponse } from "next/server";
import { getVenues } from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const approvedOnly = request.nextUrl.searchParams.get("approved") === "true";
    const venues = await getVenues();

    return Response.json({
      venues: approvedOnly ? venues.filter((venue) => venue.isApproved) : venues
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

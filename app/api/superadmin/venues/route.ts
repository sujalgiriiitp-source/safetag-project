import { NextRequest, NextResponse } from "next/server";
import { updateVenueApproval } from "@/lib/repository";

export async function POST(request: NextRequest) {
  try {
    const { venueId, isApproved } = await request.json();
    if (!venueId || typeof isApproved !== "boolean") {
      return NextResponse.json(
        { error: "venueId and isApproved are required." },
        { status: 400 }
      );
    }

    const venue = await updateVenueApproval(venueId, isApproved);
    return NextResponse.json({ success: true, venue });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update venue approval" },
      { status: 500 }
    );
  }
}

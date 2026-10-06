import { NextRequest, NextResponse } from "next/server";
import { updateVenueApproval } from "@/lib/repository";
import { getCurrentSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // TODO(security): AuthSession has no "superadmin" role (OperatorRole = "operator" | "admin").
    // Gating on "admin" as a stopgap — add a real superadmin role/allowlist before production use.
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

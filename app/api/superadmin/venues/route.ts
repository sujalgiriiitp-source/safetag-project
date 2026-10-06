import { NextRequest, NextResponse } from "next/server";
import { updateVenueApproval, updateVenueSubscription } from "@/lib/repository";
import { getCurrentSession } from "@/lib/session";

const SUBSCRIPTION_STATUSES = ["none", "trial", "active", "expired"] as const;

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

    const { venueId, isApproved, subscriptionStatus, subscriptionExpiresAt, subscriptionNotes } =
      await request.json();
    if (!venueId) {
      return NextResponse.json({ error: "venueId is required." }, { status: 400 });
    }

    // Manual subscription management: the venue pays via UPI off-platform and
    // the admin activates/renews the subscription here. No payment gateway.
    if (typeof subscriptionStatus === "string") {
      if (!SUBSCRIPTION_STATUSES.includes(subscriptionStatus as (typeof SUBSCRIPTION_STATUSES)[number])) {
        return NextResponse.json({ error: "Invalid subscriptionStatus." }, { status: 400 });
      }
      const venue = await updateVenueSubscription(venueId, {
        status: subscriptionStatus as (typeof SUBSCRIPTION_STATUSES)[number],
        expiresAt: typeof subscriptionExpiresAt === "string" ? subscriptionExpiresAt : undefined,
        notes: typeof subscriptionNotes === "string" ? subscriptionNotes : undefined
      });
      return NextResponse.json({ success: true, venue });
    }

    if (typeof isApproved !== "boolean") {
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

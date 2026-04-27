import { NextRequest, NextResponse } from "next/server";
import { getVenueById, updateVenueSettings } from "@/lib/repository";
import { getCurrentSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const venue = await getVenueById(session.venueId);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const body = await request.json();
    const updated = await updateVenueSettings(session.venueId, {
      name: body.name || venue.name,
      address: body.address || venue.address,
      city: body.city || venue.city,
      state: body.state || venue.state,
      logoUrl: body.logoUrl || venue.logoUrl,
      customInstructions: body.customInstructions || venue.customInstructions,
      customItemCategories: body.customItemCategories?.length
        ? body.customItemCategories
        : venue.customItemCategories,
      thermalPrinterSize: body.thermalPrinterSize || venue.thermalPrinterSize,
      operatorPhones: body.operatorPhones?.length ? body.operatorPhones : venue.operatorPhones,
      operatingHours: body.operatingHours || venue.operatingHours
    });

    return NextResponse.json({ success: true, venue: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save settings" },
      { status: 500 }
    );
  }
}

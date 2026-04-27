import { NextRequest, NextResponse } from "next/server";
import { detectItemsFromImage } from "@/lib/vision";

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, fileName, venueType } = await request.json();
    if (!venueType) {
      return NextResponse.json({ error: "Venue type is required." }, { status: 400 });
    }

    const detectedItems = await detectItemsFromImage(imageBase64, fileName, venueType);
    return NextResponse.json({ detectedItems });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI detection failed" },
      { status: 500 }
    );
  }
}

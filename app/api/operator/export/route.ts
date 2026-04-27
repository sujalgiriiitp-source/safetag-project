import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummary, getDeposits, getVenueById } from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const venueId = searchParams.get("venueId");
    const kind = searchParams.get("kind");

    if (!venueId || !kind) {
      return NextResponse.json({ error: "venueId and kind are required." }, { status: 400 });
    }

    const venue = await getVenueById(venueId);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }

    if (kind === "items") {
      const deposits = await getDeposits({ venueId });
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFontSize(20);
      doc.text(`${venue.name} - items report`, 48, 56);
      doc.setFontSize(11);
      deposits.slice(0, 24).forEach((deposit, index) => {
        doc.text(
          `${deposit.tokenId} | ${deposit.visitorName} | ${deposit.status} | ${deposit.itemsList.join(", ")}`,
          48,
          92 + index * 20
        );
      });
      const pdf = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${venue.name}-items-report.pdf"`
        }
      });
    }

    if (kind === "analytics") {
      const analytics = await getAnalyticsSummary(venueId);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFontSize(20);
      doc.text(`${venue.name} - analytics report`, 48, 56);
      doc.setFontSize(12);
      doc.text(`Staff suggestion: ${analytics.staffSuggestion}`, 48, 88);
      doc.text("Weekly check-ins", 48, 126);
      analytics.weeklyCheckIns.forEach((point, index) => {
        doc.text(`${point.label}: ${point.value}`, 64, 152 + index * 18);
      });
      doc.text("Peak hours", 48, 278);
      analytics.peakHours.forEach((point, index) => {
        doc.text(`${point.label}: ${point.value}`, 64, 304 + index * 18);
      });
      doc.text("Item breakdown", 48, 430);
      analytics.itemBreakdown.forEach((point, index) => {
        doc.text(`${point.label}: ${point.value}`, 64, 456 + index * 18);
      });
      const pdf = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${venue.name}-analytics-report.pdf"`
        }
      });
    }

    return NextResponse.json({ error: "Unsupported export kind." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

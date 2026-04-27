import { Deposit, Venue } from "@/types";

export async function generateReceiptPdfBuffer(deposit: Deposit, venue: Venue) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFontSize(22);
  doc.text("SafeTag Digital Receipt", 48, 58);
  doc.setFontSize(12);
  doc.text("Apna saman Safe Rakho - Tension Free Everywhere", 48, 82);

  const lines = [
    `Token ID: ${deposit.tokenId}`,
    `Venue: ${venue.name}, ${venue.city}`,
    `Visitor: ${deposit.visitorName}`,
    `Phone: ${deposit.visitorPhone}`,
    `Items: ${deposit.itemsList.join(", ")}`,
    `AI Detected: ${deposit.aiDetectedItems.join(", ") || "None"}`,
    `Check-in Time: ${new Date(deposit.checkInTime).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata"
    })}`,
    `Short URL: ${deposit.shortUrl}`,
    "Instruction: Yeh QR code dikhao jab saman wapas lena ho."
  ];

  lines.forEach((line, index) => {
    doc.text(line, 48, 132 + index * 24);
  });

  return Buffer.from(doc.output("arraybuffer"));
}

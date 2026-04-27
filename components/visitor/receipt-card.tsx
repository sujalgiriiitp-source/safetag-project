"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Download, MessageCircle, Printer, ShieldCheck } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Deposit, Venue } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildGuardianAlertMessage, formatWhatsappClock } from "@/lib/whatsapp-templates";
import { formatDateTime, formatStatus, getStatusClasses, maskPhone } from "@/lib/utils";

export function ReceiptCard({ deposit, venue }: { deposit: Deposit; venue: Venue }) {
  const receiptUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL || "";
    return `${base}/receipt/${deposit.tokenId}`;
  }, [deposit.tokenId]);

  function downloadQr() {
    const canvas = document.getElementById("receipt-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${deposit.tokenId}.png`;
    link.click();
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Your SafeTag receipt 🔐\nToken: ${deposit.tokenId}\nVenue: ${venue.name}, ${venue.city}\nItems: ${deposit.itemsList.join(
      ", "
    )}\nCollect your items with this QR slip.\nsafetag.in`
  )}`;
  const guardianMessagePreview = deposit.guardianPhone
    ? buildGuardianAlertMessage({
        visitorName: deposit.visitorName,
        venueName: venue.name,
        city: venue.city,
        itemsList: deposit.itemsList,
        tokenId: deposit.tokenId,
        checkInTime: deposit.checkInTime,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://safetag.in"
      })
        .split("\n")
        .slice(0, 6)
        .join("\n")
    : "";

  return (
    <Card className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <CardHeader className="items-center border-b border-slate-200 bg-white text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <ShieldCheck className="size-6" />
        </div>
        <CardTitle className="mt-2 text-2xl font-black tracking-widest text-slate-900">SAFETAG</CardTitle>
        <div>
          <p className="text-lg font-bold text-blue-600">{venue.name}</p>
          <p className="text-sm text-slate-400">{venue.city}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-8">
        <div className="text-center">
          <div className="mx-auto w-fit rounded-2xl border-4 border-blue-600 bg-white p-4 shadow-lg">
            <QRCodeCanvas
              id="receipt-qr"
              value={receiptUrl}
              size={220}
              fgColor="#1E3A8A"
              bgColor="#FFFFFF"
              includeMargin
            />
          </div>
          <p className="mt-4 text-sm text-slate-500">Short URL</p>
          <p className="mt-1 break-all font-medium text-slate-700">{deposit.shortUrl}</p>
          <p className="mt-4 text-2xl font-bold tracking-widest text-slate-800">{deposit.tokenId}</p>
        </div>

        {deposit.guardianPhone ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-700">✅ WhatsApp sent to guardian</p>
            <p className="mt-1 text-sm text-slate-600">
              {maskPhone(deposit.guardianPhone)} at {formatWhatsappClock(deposit.checkInTime)}
            </p>
            <div className="mt-3 rounded-lg bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                💬 Message preview:
              </p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{guardianMessagePreview}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Visitor name</p>
            <p className="mt-2 text-lg font-semibold text-slate-800">{deposit.visitorName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Date and time</p>
            <p className="mt-2 text-lg font-semibold text-slate-800">{formatDateTime(deposit.checkInTime)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Status</p>
            <Badge className={`mt-3 ${getStatusClasses(deposit.status, deposit.checkInTime, deposit.returnTime)}`}>
              {formatStatus(deposit.status, deposit.checkInTime, deposit.returnTime)}
            </Badge>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Venue</p>
            <p className="mt-2 text-lg font-semibold text-slate-800">
              {venue.name}, {venue.city}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
            <p className="text-sm text-slate-500">Phone</p>
            <p className="mt-2 text-lg font-semibold text-slate-800">{deposit.visitorPhone}</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Declared items</p>
          <div className="mt-3 grid gap-2">
            {deposit.itemsList.map((item) => (
              <p key={item} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="font-semibold text-emerald-500">✓</span>
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Button onClick={downloadQr} className="w-full">
            <Download className="size-4" />
            Download QR
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-0 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
          >
            <Link href={`/receipt/${deposit.tokenId}/print`}>
              <Printer className="size-4" />
              Print again
            </Link>
          </Button>
          <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              Share on WhatsApp
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

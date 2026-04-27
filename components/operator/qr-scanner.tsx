"use client";

import Image from "next/image";
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "sonner";
import { MismatchAlert } from "@/components/ai/mismatch-alert";
import { PhotoCapture } from "@/components/operator/photo-capture";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { readApiJson } from "@/lib/api";
import { extractTokenId } from "@/lib/qr";
import {
  formatDateTime,
  formatStatus,
  formatTimeAgo,
  getStatusClasses
} from "@/lib/utils";

interface DepositPayload {
  tokenId: string;
  visitorName: string;
  visitorPhone: string;
  guardianPhone?: string;
  venueType: string;
  itemsList: string[];
  aiDetectedItems: string[];
  operatorDetectedItems: string[];
  visitorUploadPhotoUrl?: string;
  operatorCapturedPhotoUrl?: string;
  photoMismatchAlert: boolean;
  status: string;
  checkInTime: string;
  returnTime?: string;
}

interface VenuePayload {
  _id: string;
  name: string;
  city: string;
}

interface ComparisonPayload {
  missing: string[];
  unexpected: string[];
  mismatch: boolean;
}

export function QRScanner() {
  const [manualToken, setManualToken] = useState("");
  const [deposit, setDeposit] = useState<DepositPayload | null>(null);
  const [venue, setVenue] = useState<VenuePayload | null>(null);
  const [comparison, setComparison] = useState<ComparisonPayload | null>(null);
  const [photoBase64, setPhotoBase64] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoFileName, setPhotoFileName] = useState("");
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"returned" | null>(null);

  function maskVisitorPhone(phone: string) {
    const clean = phone.replace(/[^\d+]/g, "");
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 3)}*****${clean.slice(-2)}`;
  }

  async function loadDeposit(rawValue: string) {
    const tokenId = extractTokenId(rawValue);
    if (!tokenId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/deposits/${tokenId}`);
      const data = await readApiJson<{ deposit: DepositPayload; venue?: VenuePayload }>(
        response,
        "Deposit not found"
      );
      setDeposit(data.deposit);
      setVenue(data.venue ?? null);
      setComparison(null);
      setPhotoBase64("");
      setPhotoPreviewUrl(data.deposit.operatorCapturedPhotoUrl || data.deposit.visitorUploadPhotoUrl || "");
      setPhotoFileName("");
      setDetectedItems(data.deposit.operatorDetectedItems ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load deposit");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsReturned() {
    if (!deposit) return;
    const confirmed = window.confirm(
      `Have you physically returned all items to ${deposit.visitorName}?`
    );
    if (!confirmed) return;

    setActionLoading("returned");
    try {
      const response = await fetch("/api/operator/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: deposit.tokenId,
          action: "returned"
        })
      });
      await readApiJson(response, "Could not update deposit");
      toast.success(`Items returned to ${deposit.visitorName} ✅`);
      await loadDeposit(deposit.tokenId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  const effectiveDetectedItems = detectedItems.length
    ? detectedItems
    : deposit?.operatorDetectedItems ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.48fr_0.52fr]">
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">Camera-based QR scanner</CardTitle>
          <CardDescription>
            Camera page load hote hi open hoti hai. QR slip ya phone receipt dono se token read ho jayega.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
            <Scanner
              onScan={(result) => {
                const value = result[0]?.rawValue;
                if (value) loadDeposit(value);
              }}
              onError={(error) => console.error(error)}
              constraints={{ facingMode: "environment" }}
            />
          </div>
          <p className="text-sm text-slate-400">Scanning...</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Manual token or receipt URL"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
            />
            <Button variant="outline" onClick={() => loadDeposit(manualToken)} disabled={loading} className="sm:min-w-[120px]">
              {loading ? <Spinner /> : null}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">Scanned deposit</CardTitle>
            <CardDescription>
              Visitor details, item list, proof photo, aur time since check-in yahin show hota hai.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {deposit ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-slate-800">{deposit.visitorName}</p>
                    <p className="text-sm text-slate-400">Phone: {maskVisitorPhone(deposit.visitorPhone)}</p>
                    <p className="mt-2 text-sm text-slate-500">Venue: {venue?.name ?? "Unknown venue"}</p>
                    <p className="text-sm text-slate-500">Token: {deposit.tokenId}</p>
                  </div>
                  <Badge
                    className={`font-bold ${getStatusClasses(
                      deposit.status as any,
                      deposit.checkInTime,
                      deposit.returnTime
                    )}`}
                  >
                    {formatStatus(deposit.status as any, deposit.checkInTime, deposit.returnTime).toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">Items deposited:</p>
                  <div className="flex flex-wrap gap-2">
                    {deposit.itemsList.map((item) => (
                      <span key={item} className="inline-block rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <p className="text-slate-500">Checked in: {formatDateTime(deposit.checkInTime)}</p>
                  <p className="w-fit rounded-lg bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                    ⏱ {formatTimeAgo(deposit.checkInTime)}
                  </p>
                </div>

                {photoPreviewUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <Image
                      src={photoPreviewUrl}
                      alt={`${deposit.tokenId} proof`}
                      width={1200}
                      height={900}
                      className="h-56 w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}

                <p className="text-xs font-medium text-amber-600">⚠ Verify items before returning</p>

                {comparison?.mismatch || deposit.photoMismatchAlert ? (
                  <MismatchAlert declaredItems={deposit.itemsList} detectedItems={effectiveDetectedItems} />
                ) : null}

                <div className="grid gap-3">
                  <Button
                    className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md hover:bg-blue-700"
                    onClick={handleMarkAsReturned}
                    disabled={actionLoading === "returned" || formatStatus(deposit.status as any, deposit.checkInTime, deposit.returnTime) === "Returned"}
                  >
                    {actionLoading === "returned" ? <Spinner /> : null}
                    📦 Mark as Returned
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Scan a live QR or paste a token to inspect a deposit.
              </div>
            )}
          </CardContent>
        </Card>

        {deposit ? (
          <PhotoCapture
            venueType={deposit.venueType as any}
            previewUrl={photoPreviewUrl}
            detectedItems={effectiveDetectedItems}
            onCapture={({ imageBase64, previewUrl, detectedItems, fileName }) => {
              setPhotoBase64(imageBase64);
              setPhotoPreviewUrl(previewUrl);
              setDetectedItems(detectedItems);
              setPhotoFileName(fileName);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

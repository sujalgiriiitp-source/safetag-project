"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Printer, QrCode, ReceiptText, Sparkles } from "lucide-react";
import { ItemDetector } from "@/components/ai/item-detector";
import { WhatsAppBubble } from "@/components/whatsapp/whatsapp-bubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { readApiJson } from "@/lib/api";
import { VENUE_TYPE_META } from "@/lib/constants";
import { maskPhone } from "@/lib/utils";
import { buildGuardianPreviewMessage, formatWhatsappClock } from "@/lib/whatsapp-templates";
import { Venue } from "@/types";

interface CreatedDeposit {
  tokenId: string;
  visitorName: string;
  visitorPhone: string;
  itemsList: string[];
}

const QRCodeCanvas = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeCanvas), {
  ssr: false,
  loading: () => <div className="h-[240px] w-[240px] rounded-sm bg-primary/10" aria-hidden="true" />,
});

export function OperatorCheckinForm({ venue, operatorPhone }: { venue: Venue; operatorPhone: string }) {
  const router = useRouter();
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [aiDetectedItems, setAiDetectedItems] = useState<string[]>([]);
  const [imageBase64, setImageBase64] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdDeposit, setCreatedDeposit] = useState<CreatedDeposit | null>(null);
  const [previewTime, setPreviewTime] = useState(() => new Date().toISOString());

  const receiptUrl = useMemo(
    () =>
      createdDeposit
        ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/receipt/${createdDeposit.tokenId}`
        : "",
    [createdDeposit]
  );

  const guardianPreviewText = useMemo(
    () =>
      buildGuardianPreviewMessage({
        visitorName: visitorName || "[Name]",
        venueName: venue.name || "[Venue]",
        itemsList: items,
        tokenId: `ST-${VENUE_TYPE_META[venue.type].shortCode}-XXXXX`,
        checkInTime: previewTime
      }),
    [items, previewTime, venue.name, venue.type, visitorName]
  );

  useEffect(() => {
    if (!createdDeposit) return;
    window.open(`/receipt/${createdDeposit.tokenId}/print`, "_blank", "noopener,noreferrer");
  }, [createdDeposit]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPreviewTime(new Date().toISOString());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  function toggleItem(item: string) {
    setItems((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  }

  async function handleSubmit() {
    if (!visitorName || !visitorPhone || items.length === 0) {
      toast.error("Visitor details aur kam se kam ek item required hai.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName,
          visitorPhone,
          guardianName,
          guardianPhone,
          venueId: venue._id,
          venueType: venue.type,
          itemsList: items,
          aiDetectedItems,
          imageBase64,
          checkedInByPhone: operatorPhone
        })
      });
      const data = await readApiJson<{
        deposit: {
          tokenId: string;
          visitorName: string;
          visitorPhone: string;
          itemsList: string[];
          guardianPhone?: string;
        };
      }>(response, "Could not generate receipt");
      setCreatedDeposit({
        tokenId: data.deposit.tokenId,
        visitorName: data.deposit.visitorName,
        visitorPhone: data.deposit.visitorPhone,
        itemsList: data.deposit.itemsList
      });
      toast.success("Receipt generated successfully");

      if (data.deposit.guardianPhone) {
        toast.success("✅ WhatsApp sent to guardian!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdDeposit) {
    return (
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-slate-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Receipt Generated</Badge>
                <Badge>{createdDeposit.tokenId}</Badge>
              </div>
              <CardTitle className="mt-3 text-3xl">QR ready for visitor</CardTitle>
              <CardDescription className="mt-2">
                Print window open ho chuki hai. Ab operator `Scan QR` flow se storage photo capture kar sakta hai.
              </CardDescription>
            </div>
            <CheckCircle2 className="text-emerald-500" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.44fr_0.56fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto w-fit rounded-2xl border-4 border-blue-600 bg-white p-4 shadow-lg">
              <QRCodeCanvas id="checkin-receipt-qr" value={receiptUrl} size={240} includeMargin fgColor="#1E3A8A" />
            </div>
            <p className="mt-4 text-sm text-slate-500">Token</p>
            <p className="text-xl font-semibold text-slate-800">{createdDeposit.tokenId}</p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Visitor</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">{createdDeposit.visitorName}</p>
              <p className="text-sm text-slate-600">{createdDeposit.visitorPhone}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Items declared</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {createdDeposit.itemsList.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/receipt/${createdDeposit.tokenId}`}>
                  <QrCode data-icon="inline-start" />
                  Open digital receipt
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/receipt/${createdDeposit.tokenId}/print`}>
                  <Printer data-icon="inline-start" />
                  Reprint slip
                </Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setCreatedDeposit(null);
                  setVisitorName("");
                  setVisitorPhone("");
                  setGuardianName("");
                  setGuardianPhone("");
                  setItems([]);
                  setAiDetectedItems([]);
                  setImageBase64("");
                  setPreviewUrl("");
                  router.push("/dashboard");
                }}
              >
                <ReceiptText data-icon="inline-start" />
                Back to dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-800">New check-in</CardTitle>
          <CardDescription>
            Visitor ko kuch bhi download nahi karna. Staff counter se sab register karta hai.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="visitor-name">Visitor full name</Label>
              <Input
                id="visitor-name"
                value={visitorName}
                onChange={(event) => setVisitorName(event.target.value)}
                placeholder="Rahul Sharma"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="visitor-phone">Phone number</Label>
              <Input
                id="visitor-phone"
                value={visitorPhone}
                onChange={(event) => setVisitorPhone(event.target.value)}
                placeholder="+919812345678"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guardian-name">Guardian name (optional)</Label>
              <Input
                id="guardian-name"
                value={guardianName}
                onChange={(event) => setGuardianName(event.target.value)}
                placeholder="Parent or guardian"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guardian-phone">Guardian phone (optional)</Label>
              <Input
                id="guardian-phone"
                value={guardianPhone}
                onChange={(event) => setGuardianPhone(event.target.value)}
                placeholder="+919800000111"
              />
            </div>
            <div className="grid gap-3 sm:col-span-2">
              <div>
                <Label>Guardian WhatsApp Preview</Label>
                <p className="mt-1 text-sm text-slate-500">
                  WhatsApp will be sent to: {guardianPhone ? maskPhone(guardianPhone) : "+91XXXXXXXXXX"}
                </p>
              </div>
              <WhatsAppBubble
                body={guardianPreviewText}
                time={formatWhatsappClock(previewTime)}
                shellClassName="bg-slate-50"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-800">Items checklist</p>
                <p className="text-sm text-slate-500">
                  Venue type: {venue.name} - {venue.city}
                </p>
              </div>
              <Badge>{venue.type}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {venue.customItemCategories.map((item) => (
                <div
                  key={item}
                  className={
                    items.includes(item)
                      ? "rounded-lg border border-blue-400 bg-blue-50"
                      : "rounded-lg border border-slate-200 bg-white"
                  }
                >
                  <Checkbox
                    checked={items.includes(item)}
                    onChange={() => toggleItem(item)}
                    label={item}
                  />
                </div>
              ))}
            </div>
          </div>

          <ItemDetector
            venueType={venue.type}
            detectedItems={aiDetectedItems}
            previewUrl={previewUrl}
            onDetected={({ imageBase64: nextBase64, previewUrl: nextPreview, detectedItems: detected }) => {
              setImageBase64(nextBase64);
              setPreviewUrl(nextPreview);
              setAiDetectedItems(detected);
              setItems((current) => [...new Set([...current, ...detected])]);
            }}
          />

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full rounded-xl py-4 text-base font-bold shadow-lg hover:shadow-xl"
          >
            {submitting ? <Spinner /> : null}
            🔐 Generate receipt
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">Counter guidance</CardTitle>
          <CardDescription>
            Yeh flow phone pe bhi fast kaam karega aur bilingual operator teams ke liye simple rahega.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-700">AI item suggestions</p>
                <p className="text-sm text-slate-500">
                  Visitor photo upload se items auto-check ho jayenge. Staff manually override kar sakta hai.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Next after receipt</p>
            <p className="mt-2 text-sm text-slate-500">
              QR slip print hone ke baad operator `Scan QR` ya `Manual Search` flow mein item photo capture karke status stored confirm karega.
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">WhatsApp trust layer</p>
            <p className="mt-2 text-sm text-slate-500">
              Visitor aur guardian dono ko receipt updates milte hain, isliye loss anxiety kaafi kam hoti hai.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

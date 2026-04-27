"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";
import { Camera, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { readApiJson } from "@/lib/api";
import { VenueType } from "@/types";

export function PhotoCapture({
  venueType,
  detectedItems,
  previewUrl,
  onCapture
}: {
  venueType: VenueType;
  detectedItems: string[];
  previewUrl?: string;
  onCapture: (payload: {
    imageBase64: string;
    previewUrl: string;
    detectedItems: string[];
    fileName: string;
  }) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = async () => {
      const imageBase64 = String(reader.result);
      setLoading(true);

      try {
        const response = await fetch("/api/ai/detect-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            fileName: file.name,
            venueType
          })
        });
        const data = await readApiJson<{ detectedItems?: string[] }>(response, "Could not detect items");
        onCapture({
          imageBase64,
          previewUrl: preview,
          detectedItems: data.detectedItems ?? [],
          fileName: file.name
        });
        toast.success("Photo saved locally. Ready to mark as stored.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Detection failed");
        onCapture({
          imageBase64,
          previewUrl: preview,
          detectedItems: [],
          fileName: file.name
        });
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  }

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">Capture item photo for proof</CardTitle>
        <CardDescription>
          Operator phone ya tablet se photo capture kijiye. Yeh image Cloudinary pe save hogi aur return time par visible rahegi.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="border-slate-300 bg-white hover:bg-slate-50">
            <label className="cursor-pointer">
              {loading ? <Spinner /> : <Camera data-icon="inline-start" />}
              Capture photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </Button>
          {previewUrl ? (
            <Badge variant="success">
              <CheckCircle2 />
              Photo ready
            </Badge>
          ) : null}
        </div>

        {previewUrl ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <Image
              src={previewUrl}
              alt="Operator capture preview"
              width={1200}
              height={800}
              className="h-56 w-full object-cover"
              unoptimized
            />
          </div>
        ) : null}

        {detectedItems.length ? (
          <div className="flex flex-wrap gap-2">
            {detectedItems.map((item) => (
              <Badge key={item} variant="success" className="rounded-full px-3 py-1">
                AI detected {item}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

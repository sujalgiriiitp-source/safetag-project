"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { readApiJson } from "@/lib/api";
import { VenueType } from "@/types";

export function ItemDetector({
  venueType,
  detectedItems,
  previewUrl,
  onDetected
}: {
  venueType: VenueType;
  detectedItems: string[];
  previewUrl?: string;
  onDetected: (payload: { imageBase64: string; previewUrl: string; detectedItems: string[] }) => void;
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
        onDetected({
          imageBase64,
          previewUrl: preview,
          detectedItems: data.detectedItems ?? []
        });
        toast.success("AI detection complete");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Detection failed");
        onDetected({
          imageBase64,
          previewUrl: preview,
          detectedItems: []
        });
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  }

  return (
    <Card className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-700">
          ✨ AI item detector
        </CardTitle>
        <CardDescription>
          Optional photo upload. Google Vision labels are mapped to SafeTag categories automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="border-blue-200 bg-white hover:bg-blue-50">
            <label className="cursor-pointer">
              {loading ? <Spinner /> : null}
              Upload item photo
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </Button>
          {detectedItems.length ? (
            <Badge className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
              {detectedItems.length} AI detected
            </Badge>
          ) : (
            <Badge variant="secondary">No AI suggestions yet</Badge>
          )}
        </div>

        {previewUrl ? (
          <div className="overflow-hidden rounded-xl border border-blue-200 shadow-sm">
            <Image
              src={previewUrl}
              alt="Uploaded items preview"
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
              <Badge
                key={item}
                className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
              >
                AI Detected {item}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

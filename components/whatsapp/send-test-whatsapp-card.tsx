"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WhatsAppBubble } from "@/components/whatsapp/whatsapp-bubble";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { readApiJson } from "@/lib/api";
import { formatWhatsappClock } from "@/lib/whatsapp-templates";

export function SendTestWhatsAppCard({
  defaultPhone,
  previewMessage
}: {
  defaultPhone: string;
  previewMessage: string;
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState("");

  async function sendTestMessage() {
    setSending(true);
    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, message: previewMessage })
      });
      await readApiJson(response, "Could not send WhatsApp message");
      setSentMessage("✅ Message sent! Check WhatsApp on the phone above.");
      toast.success("✅ Message sent! Check WhatsApp on the phone above.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send WhatsApp message");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Test WhatsApp</CardTitle>
        <CardDescription>
          Use a live number to trigger the exact parent-facing SafeTag alert during the demo.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="demo-whatsapp-phone">Phone number</Label>
          <Input
            id="demo-whatsapp-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <WhatsAppBubble
          body={previewMessage}
          time={formatWhatsappClock()}
          shellClassName="bg-slate-900"
        />
        <Button variant="success" onClick={sendTestMessage} disabled={!phone || sending}>
          {sending ? <Spinner /> : null}
          Send Live WhatsApp Now
        </Button>
        {sentMessage ? <p className="text-sm font-medium text-emerald-600">{sentMessage}</p> : null}
      </CardContent>
    </Card>
  );
}

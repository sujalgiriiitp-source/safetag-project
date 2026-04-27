"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { readApiJson } from "@/lib/api";

export function BroadcastForm() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function sendBroadcast() {
    setSending(true);
    try {
      const response = await fetch("/api/superadmin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      await readApiJson(response, "Could not send broadcast");
      setMessage("");
      toast.success("Broadcast sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send broadcast");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-emerald-800">
          💬 Broadcast WhatsApp message
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Textarea
          className="border-emerald-300 bg-white focus:ring-emerald-500"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Platform maintenance at 9 PM. Please keep backup slips ready."
        />
        <Button
          onClick={sendBroadcast}
          disabled={!message || sending}
          className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-md hover:bg-emerald-700"
        >
          {sending ? <Spinner /> : null}
          Send broadcast
        </Button>
      </CardContent>
    </Card>
  );
}

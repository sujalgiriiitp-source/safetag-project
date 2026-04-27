"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { readApiJson } from "@/lib/api";

const demoPhones = [
  "+919811110001 operator",
  "+919811110002 admin",
  "+919811110003 operator",
  "+919811110005 admin"
];

export default function OperatorLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function requestOtp() {
    setSending(true);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "operator_login" })
      });
      const data = await readApiJson<{ demoCode?: string }>(response, "Unable to send OTP");
      setOtpSent(true);
      toast.success(data.demoCode ? `Demo OTP: ${data.demoCode}` : "OTP sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send OTP");
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    setVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "operator_login", code })
      });
      const data = await readApiJson<{ redirectTo?: string }>(response, "Could not verify OTP");
      toast.success("Logged in successfully");
      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="grid gap-6">
          <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-800">Operator login</CardTitle>
              <CardDescription>
                Phone OTP only. Operators can access only their own venue records and live actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Phone number</label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+919811110001" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={requestOtp} disabled={sending} className="w-full">
                  {sending ? <Spinner /> : null}
                  Send OTP
                </Button>
                <Badge variant={otpSent ? "success" : "secondary"}>
                  {otpSent ? "OTP sent" : "Awaiting phone"}
                </Badge>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">OTP code</label>
                <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" maxLength={6} />
              </div>
              <Button
                onClick={verifyCode}
                variant="outline"
                disabled={!otpSent || verifying}
                className="w-full border-0 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
              >
                {verifying ? <Spinner /> : null}
                Verify and continue
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800">Demo login hints</CardTitle>
              <CardDescription>Use these seed accounts during the hackathon demo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoPhones.map((entry) => (
                <div
                  key={entry}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 font-mono text-sm text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50"
                >
                  <p className="font-medium">{entry}</p>
                </div>
              ))}
              <p className="text-sm text-slate-500">
                If Twilio Verify is not configured, OTP will be <span className="font-semibold text-blue-600">123456</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

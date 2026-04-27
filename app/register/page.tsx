"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, CheckCircle2, Clock3, MessageCircle, ShieldCheck, Store } from "lucide-react";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { readApiJson } from "@/lib/api";
import { DEMO_OTP, HOW_IT_WORKS_VENUE, VENUE_TYPE_META } from "@/lib/constants";
import { VenueType } from "@/types";

export default function RegisterVenuePage() {
  const [form, setForm] = useState({
    name: "",
    type: "exam" as VenueType,
    city: "",
    state: "",
    address: "",
    pincode: "",
    contactName: "",
    contactPhone: ""
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedVenueName, setSubmittedVenueName] = useState("");

  const venueTypeOptions = useMemo(
    () => Object.entries(VENUE_TYPE_META) as Array<[VenueType, (typeof VENUE_TYPE_META)[VenueType]]>,
    []
  );
  const selectedVenueMeta = VENUE_TYPE_META[form.type];

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function requestOtp() {
    setSendingOtp(true);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.contactPhone, purpose: "venue_registration" })
      });
      const data = await readApiJson<{ demoCode?: string }>(response, "Unable to send OTP");
      setOtpSent(true);
      toast.success(data.demoCode ? `Demo OTP: ${DEMO_OTP}` : "OTP sent successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    setVerifyingOtp(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.contactPhone,
          purpose: "venue_registration",
          code: otpCode
        })
      });
      await readApiJson(response, "OTP verification failed");
      setOtpVerified(true);
      toast.success("Phone verified");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function submitVenue() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/venues/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await readApiJson<{ venue: { name: string } }>(response, "Venue registration failed");
      setSubmittedVenueName(data.venue.name);
      toast.success("Venue registration submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit venue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[0.44fr_0.56fr]">
          <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-800">Register your venue free</CardTitle>
              <CardDescription>
                Staff-only onboarding for exam centers, temples, parks, museums, and every high-footfall venue that needs a proof-based deposit counter.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Store />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Why venues switch fast</p>
                    <p className="text-sm text-slate-600">
                      Koi hardware nahi. Koi locker setup nahi. Existing counter, existing staff, same-day start.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Live venue preview
                </p>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Building2 className="size-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{form.name || "Your venue name"}</p>
                      <p className="mt-1 text-sm text-slate-500">{selectedVenueMeta.label}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {[form.address, form.city, form.state].filter(Boolean).join(", ") ||
                          "Address, city and state will appear here"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">QR ready</span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">WhatsApp alerts</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Why venues join SafeTag
                </p>
                {[
                  [ShieldCheck, "Proof-based returns", "QR + photo proof reduces mix-ups at busy counters."],
                  [MessageCircle, "Guardian trust", "WhatsApp alerts reassure families instantly."],
                  [Clock3, "Same-day launch", "No hardware purchase, no locker installation."]
                ].map(([Icon, title, copy]) => {
                  const BenefitIcon = Icon as typeof ShieldCheck;
                  return (
                    <div key={title as string} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <BenefitIcon className="mt-0.5 size-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{title as string}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{copy as string}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid gap-3">
                {HOW_IT_WORKS_VENUE.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-xl p-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm text-slate-600">{step}</p>
                  </div>
                ))}
              </div>
              {submittedVenueName ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-slate-800">{submittedVenueName} submitted</p>
                      <p className="mt-1 text-sm text-slate-600">
                        ✅ Submitted! We'll approve within 24 hours. Confirmation WhatsApp contact number par bhej diya gaya hai.
                      </p>
                      <p className="mt-3 text-sm font-semibold text-emerald-700">
                        Need help? WhatsApp: +91 6306601592
                      </p>
                      <div className="mt-4 grid gap-2 text-xs text-slate-600">
                        <p>1. SafeTag team reviews venue details.</p>
                        <p>2. Operator access is activated after approval.</p>
                        <p>3. Your counter can start issuing QR receipts.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800">Venue details</CardTitle>
              <CardDescription>
                OTP verify karke form submit kariye. Contact number ko admin access ke liye use kiya jayega.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="venue-name">Venue name</Label>
                  <Input
                    id="venue-name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="St. Xavier's CBT Center"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="venue-type">Venue type</Label>
                  <Select
                    id="venue-type"
                    value={form.type}
                    onChange={(event) => updateField("type", event.target.value)}
                  >
                    {venueTypeOptions.map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-name">Contact person</Label>
                  <Input
                    id="contact-name"
                    value={form.contactName}
                    onChange={(event) => updateField("contactName", event.target.value)}
                    placeholder="Venue manager name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    placeholder="Lucknow"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(event) => updateField("state", event.target.value)}
                    placeholder="UP"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="Full venue address"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={form.pincode}
                    onChange={(event) => updateField("pincode", event.target.value)}
                    placeholder="226001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-phone">Contact phone</Label>
                  <Input
                    id="contact-phone"
                    value={form.contactPhone}
                    onChange={(event) => updateField("contactPhone", event.target.value)}
                    placeholder="+919811110001"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-white">
                      <ShieldCheck />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">OTP verification</p>
                      <p className="text-sm text-slate-600">
                        Contact number verify karna zaroori hai.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={requestOtp}
                    disabled={sendingOtp || !form.contactPhone}
                    className="border-0 bg-transparent px-0 py-0 text-sm font-semibold text-blue-600 shadow-none hover:bg-transparent hover:text-blue-800"
                  >
                    {sendingOtp ? <Spinner /> : null}
                    Send OTP
                  </Button>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    placeholder="Enter OTP"
                    maxLength={6}
                  />
                  <Button onClick={verifyOtp} disabled={!otpSent || verifyingOtp} className="sm:min-w-[140px]">
                    {verifyingOtp ? <Spinner /> : null}
                    Verify OTP
                  </Button>
                </div>
              </div>

              <Button
                onClick={submitVenue}
                disabled={!otpVerified || submitting}
                className="mt-4 w-full rounded-xl py-3 text-base font-semibold shadow-md hover:shadow-lg"
              >
                {submitting ? <Spinner /> : null}
                Submit for approval
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

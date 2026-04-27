"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, MapPin, Smartphone, PackageCheck, Sparkles, Users, CheckCircle2 } from "lucide-react";
import { DEFAULT_ITEM_CATEGORIES, DEMO_OTP, VENUE_TYPE_META } from "@/lib/constants";
import { Venue, VenueType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ItemDetector } from "@/components/ai/item-detector";
import { readApiJson } from "@/lib/api";

const steps = [
  { title: "Select venue type", icon: ShieldCheck },
  { title: "Choose city and venue", icon: MapPin },
  { title: "Visitor OTP verify", icon: Smartphone },
  { title: "Declare items", icon: PackageCheck },
  { title: "AI photo detection", icon: Sparkles },
  { title: "Guardian details", icon: Users },
  { title: "Confirm and submit", icon: CheckCircle2 }
];

export function CheckinForm({ venues }: { venues: Venue[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [venueType, setVenueType] = useState<VenueType | "">("");
  const [city, setCity] = useState("");
  const [venueId, setVenueId] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [aiDetectedItems, setAiDetectedItems] = useState<string[]>([]);
  const [imageBase64, setImageBase64] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredVenues = useMemo(
    () => venues.filter((venue) => (!venueType ? true : venue.type === venueType)),
    [venueType, venues]
  );

  const cities = [...new Set(filteredVenues.map((venue) => venue.city))];
  const venuesForCity = filteredVenues.filter((venue) => (!city ? true : venue.city === city));
  const selectedVenue = venues.find((venue) => venue._id === venueId);
  const itemOptions = venueType ? DEFAULT_ITEM_CATEGORIES[venueType] : [];

  function toggleItem(item: string) {
    setItems((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  }

  async function handleSendOtp() {
    if (!visitorPhone) {
      toast.error("Phone number required");
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: visitorPhone, purpose: "visitor_login" })
      });
      const data = await readApiJson<{ demoCode?: string }>(response, "Failed to send OTP");
      setOtpSent(true);
      toast.success(data.demoCode ? `Demo OTP: ${DEMO_OTP}` : "OTP sent successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    setVerifyingOtp(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: visitorPhone, purpose: "visitor_login", code: otpCode })
      });
      await readApiJson(response, "Invalid OTP");
      setOtpVerified(true);
      toast.success("Phone verified");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSubmit() {
    if (!selectedVenue || !venueType || !otpVerified) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName,
          visitorPhone,
          guardianPhone,
          guardianName,
          guardianRelation,
          venueId,
          venueType,
          itemsList: items,
          aiDetectedItems,
          imageBase64
        })
      });
      const data = await readApiJson<{ deposit: { tokenId: string } }>(
        response,
        "Could not create receipt"
      );
      toast.success("Deposit created successfully");
      router.push(`/receipt/${data.deposit.tokenId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function validateStep() {
    if (step === 0) return Boolean(venueType);
    if (step === 1) return Boolean(city && venueId);
    if (step === 2) return Boolean(visitorName && visitorPhone && otpVerified);
    if (step === 3) return items.length > 0;
    return true;
  }

  const CurrentIcon = steps[step].icon;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_0.28fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-secondary/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Step {step + 1} of {steps.length}
              </p>
              <CardTitle className="mt-2 text-2xl">{steps[step].title}</CardTitle>
              <CardDescription className="mt-1">
                Visitor flow is bilingual and operator-friendly from phone screens upward.
              </CardDescription>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <CurrentIcon className="size-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(VENUE_TYPE_META) as VenueType[]).map((type) => {
                const active = venueType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    className={`rounded-3xl border p-5 text-left transition-all ${
                      active ? "border-primary bg-primary/5 shadow-soft" : "hover:border-primary/30"
                    }`}
                    onClick={() => {
                      setVenueType(type);
                      setCity("");
                      setVenueId("");
                    }}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                      {VENUE_TYPE_META[type].shortCode}
                    </p>
                    <h3 className="mt-4 text-xl font-semibold">{VENUE_TYPE_META[type].label}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {VENUE_TYPE_META[type].bilingualLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Select id="city" value={city} onChange={(event) => setCity(event.target.value)}>
                    <option value="">Select city</option>
                    {cities.map((cityOption) => (
                      <option key={cityOption} value={cityOption}>
                        {cityOption}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Select id="venue" value={venueId} onChange={(event) => setVenueId(event.target.value)}>
                    <option value="">Select venue</option>
                    {venuesForCity.map((venue) => (
                      <option key={venue._id} value={venue._id}>
                        {venue.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {selectedVenue ? (
                <div className="rounded-3xl border bg-secondary/30 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>{selectedVenue.city}</Badge>
                    <Badge variant="success">{selectedVenue.operatingHours}</Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{selectedVenue.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedVenue.address}, {selectedVenue.state}
                  </p>
                  <p className="mt-3 text-sm">{selectedVenue.customInstructions}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="visitorName">Visitor name</Label>
                  <Input
                    id="visitorName"
                    placeholder="Ankit Mishra"
                    value={visitorName}
                    onChange={(event) => setVisitorName(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="visitorPhone">Phone</Label>
                  <Input
                    id="visitorPhone"
                    placeholder="+919876543210"
                    value={visitorPhone}
                    onChange={(event) => setVisitorPhone(event.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-3xl border p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" onClick={handleSendOtp} disabled={sendingOtp}>
                    {sendingOtp ? <Spinner /> : null}
                    Send OTP
                  </Button>
                  <Badge variant={otpVerified ? "success" : otpSent ? "warning" : "secondary"}>
                    {otpVerified ? "Verified" : otpSent ? "OTP sent" : "Awaiting OTP"}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyOtp}
                    disabled={!otpSent || verifyingOtp}
                  >
                    {verifyingOtp ? <Spinner /> : null}
                    Verify
                  </Button>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Demo mode without Twilio uses OTP <span className="font-semibold">{DEMO_OTP}</span>.
                </p>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {itemOptions.map((item) => (
                <Checkbox
                  key={item}
                  label={item}
                  checked={items.includes(item)}
                  onChange={() => toggleItem(item)}
                />
              ))}
            </div>
          ) : null}

          {step === 4 && venueType ? (
            <ItemDetector
              venueType={venueType}
              detectedItems={aiDetectedItems}
              previewUrl={previewUrl}
              onDetected={({ imageBase64, previewUrl, detectedItems }) => {
                setImageBase64(imageBase64);
                setPreviewUrl(previewUrl);
                setAiDetectedItems(detectedItems);
                setItems((current) => [...new Set([...current, ...detectedItems])]);
              }}
            />
          ) : null}

          {step === 5 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="guardianName">Guardian name (optional)</Label>
                <Input
                  id="guardianName"
                  placeholder="Sunita Mishra"
                  value={guardianName}
                  onChange={(event) => setGuardianName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guardianPhone">Guardian phone</Label>
                <Input
                  id="guardianPhone"
                  placeholder="+919812341234"
                  value={guardianPhone}
                  onChange={(event) => setGuardianPhone(event.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="guardianRelation">Relation</Label>
                <Input
                  id="guardianRelation"
                  placeholder="Mother / Father / Guardian"
                  value={guardianRelation}
                  onChange={(event) => setGuardianRelation(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="grid gap-5">
              <div className="rounded-3xl border bg-secondary/30 p-5">
                <h3 className="text-lg font-semibold">Review details</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Visitor</p>
                    <p className="font-medium">{visitorName}</p>
                    <p className="text-sm">{visitorPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-medium">{selectedVenue?.name}</p>
                    <p className="text-sm">{selectedVenue?.city}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Items</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {items.map((item) => (
                        <Badge key={item} variant={aiDetectedItems.includes(item) ? "success" : "secondary"}>
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {(guardianName || guardianPhone) && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Guardian</p>
                      <p className="font-medium">
                        {guardianName || "Not added"} {guardianRelation ? `(${guardianRelation})` : ""}
                      </p>
                      <p className="text-sm">{guardianPhone || "No guardian phone"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <Separator className="my-6" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={() => validateStep() ? setStep((current) => current + 1) : toast.error("Please complete this step first")}>
                Next step
              </Button>
            ) : (
              <Button type="button" variant="success" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Spinner /> : null}
                Submit and generate QR
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Live summary</CardTitle>
          <CardDescription>Quick preview of the deposit packet that will be created.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Venue type</p>
            <p className="font-medium">{venueType ? VENUE_TYPE_META[venueType].label : "Choose a venue type"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Selected venue</p>
            <p className="font-medium">{selectedVenue?.name || "Select city and venue"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Visitor verification</p>
            <Badge variant={otpVerified ? "success" : "warning"}>
              {otpVerified ? "Phone verified" : "OTP pending"}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Declared items</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {items.length ? items.map((item) => <Badge key={item}>{item}</Badge>) : <Badge variant="secondary">No items yet</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

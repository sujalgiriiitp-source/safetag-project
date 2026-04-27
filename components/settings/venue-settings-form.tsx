"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { readApiJson } from "@/lib/api";
import { Venue } from "@/types";

export function VenueSettingsForm({ venue }: { venue: Venue }) {
  const [form, setForm] = useState({
    name: venue.name,
    city: venue.city,
    state: venue.state,
    address: venue.address,
    logoUrl: venue.logoUrl,
    customInstructions: venue.customInstructions,
    customItemCategories: venue.customItemCategories.join(", "),
    thermalPrinterSize: venue.thermalPrinterSize,
    operatorPhones: venue.operatorPhones.join(", "),
    operatingHours: venue.operatingHours
  });
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const response = await fetch("/api/venues/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customItemCategories: form.customItemCategories
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          operatorPhones: form.operatorPhones
            .split(",")
            .map((phone) => phone.trim())
            .filter(Boolean)
        })
      });
      await readApiJson(response, "Could not save settings");
      toast.success("Venue settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Venue settings</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="venue-name">Venue name</Label>
          <Input id="venue-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="venue-logo">Logo URL</Label>
          <Input id="venue-logo" value={form.logoUrl} onChange={(event) => updateField("logoUrl", event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="venue-city">City</Label>
          <Input id="venue-city" value={form.city} onChange={(event) => updateField("city", event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="venue-state">State</Label>
          <Input id="venue-state" value={form.state} onChange={(event) => updateField("state", event.target.value)} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="venue-address">Address</Label>
          <Input id="venue-address" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="printer-size">Thermal printer size</Label>
          <Select
            id="printer-size"
            value={form.thermalPrinterSize}
            onChange={(event) => updateField("thermalPrinterSize", event.target.value)}
          >
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="operating-hours">Operating hours</Label>
          <Input
            id="operating-hours"
            value={form.operatingHours}
            onChange={(event) => updateField("operatingHours", event.target.value)}
          />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="operators">Operator phone numbers</Label>
          <Input
            id="operators"
            value={form.operatorPhones}
            onChange={(event) => updateField("operatorPhones", event.target.value)}
            placeholder="+919811110001, +919811110002"
          />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="categories">Custom item categories</Label>
          <Input
            id="categories"
            value={form.customItemCategories}
            onChange={(event) => updateField("customItemCategories", event.target.value)}
          />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="instructions">Visitor instructions</Label>
          <Textarea
            id="instructions"
            value={form.customInstructions}
            onChange={(event) => updateField("customInstructions", event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Spinner /> : null}
            Save settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

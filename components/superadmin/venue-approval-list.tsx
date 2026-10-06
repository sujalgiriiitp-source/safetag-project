"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readApiJson } from "@/lib/api";
import { SubscriptionStatus, Venue } from "@/types";

const SUBSCRIPTION_OPTIONS: SubscriptionStatus[] = ["none", "trial", "active", "expired"];

function formatExpiry(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN");
}

export function VenueApprovalList({ venues }: { venues: Venue[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState<
    Record<string, { status: SubscriptionStatus; expiresAt: string; notes: string }>
  >({});

  function getSubscriptionDraft(venue: Venue) {
    return (
      subscriptionForm[venue._id] ?? {
        status: venue.subscriptionStatus ?? "none",
        expiresAt: venue.subscriptionExpiresAt ? venue.subscriptionExpiresAt.slice(0, 10) : "",
        notes: venue.subscriptionNotes ?? ""
      }
    );
  }

  function setSubscriptionDraft(venueId: string, patch: Partial<{ status: SubscriptionStatus; expiresAt: string; notes: string }>) {
    setSubscriptionForm((current) => {
      const venue = venues.find((item) => item._id === venueId);
      const base = current[venueId] ?? {
        status: venue?.subscriptionStatus ?? "none",
        expiresAt: venue?.subscriptionExpiresAt ? venue.subscriptionExpiresAt.slice(0, 10) : "",
        notes: venue?.subscriptionNotes ?? ""
      };
      return { ...current, [venueId]: { ...base, ...patch } };
    });
  }

  async function updateSubscription(venueId: string) {
    const draft = getSubscriptionDraft(venues.find((item) => item._id === venueId)!);
    setLoadingId(venueId);
    try {
      const response = await fetch("/api/superadmin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          subscriptionStatus: draft.status,
          subscriptionExpiresAt: draft.expiresAt || undefined,
          subscriptionNotes: draft.notes || undefined
        })
      });
      await readApiJson(response, "Could not update subscription");
      toast.success("Subscription updated");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update subscription");
    } finally {
      setLoadingId(null);
    }
  }

  async function updateApproval(venueId: string, isApproved: boolean) {
    setLoadingId(venueId);
    try {
      const response = await fetch("/api/superadmin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, isApproved })
      });
      await readApiJson(response, "Could not update venue");
      toast.success(isApproved ? "Venue approved" : "Venue moved to pending");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update venue");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {venues.map((venue) => (
        <div key={venue._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-800">{venue.name}</p>
              <p className="text-sm text-slate-500">
                {venue.city}, {venue.state}
              </p>
            </div>
            <Badge className={venue.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
              {venue.isApproved ? "Approved" : "Pending"}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              size="sm"
              onClick={() => updateApproval(venue._id, true)}
              disabled={loadingId === venue._id}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateApproval(venue._id, false)}
              disabled={loadingId === venue._id}
              className="rounded-lg border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Mark Pending
            </Button>
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">Subscription</p>
              <Badge
                className={
                  venue.subscriptionStatus === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : venue.subscriptionStatus === "trial"
                      ? "bg-blue-100 text-blue-700"
                      : venue.subscriptionStatus === "expired"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-200 text-slate-600"
                }
              >
                {venue.subscriptionStatus ?? "none"}
                {formatExpiry(venue.subscriptionExpiresAt)
                  ? ` · till ${formatExpiry(venue.subscriptionExpiresAt)}`
                  : ""}
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1">
                <Label htmlFor={`sub-status-${venue._id}`}>Status</Label>
                <select
                  id={`sub-status-${venue._id}`}
                  value={getSubscriptionDraft(venue).status}
                  onChange={(event) =>
                    setSubscriptionDraft(venue._id, { status: event.target.value as SubscriptionStatus })
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                >
                  {SUBSCRIPTION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`sub-expiry-${venue._id}`}>Expires on</Label>
                <Input
                  id={`sub-expiry-${venue._id}`}
                  type="date"
                  value={getSubscriptionDraft(venue).expiresAt}
                  onChange={(event) => setSubscriptionDraft(venue._id, { expiresAt: event.target.value })}
                  className="px-3 py-1.5 text-sm"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`sub-notes-${venue._id}`}>Notes (UPI txn ref)</Label>
                <Input
                  id={`sub-notes-${venue._id}`}
                  placeholder="e.g. UPI ref 4231… paid"
                  value={getSubscriptionDraft(venue).notes}
                  onChange={(event) => setSubscriptionDraft(venue._id, { notes: event.target.value })}
                  className="px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateSubscription(venue._id)}
              disabled={loadingId === venue._id}
              className="mt-3 rounded-lg border-slate-300 px-4 py-1.5 text-sm"
            >
              Save subscription
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

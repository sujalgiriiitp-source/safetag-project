"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readApiJson } from "@/lib/api";
import { Venue } from "@/types";

export function VenueApprovalList({ venues }: { venues: Venue[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
        </div>
      ))}
    </div>
  );
}

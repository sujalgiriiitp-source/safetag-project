import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatVenueType } from "@/lib/utils";
import { Venue } from "@/types";

export function NearbyLandingSection({ venues }: { venues: Venue[] }) {
  if (!venues.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
          Find SafeTag Near Your Exam Center
        </p>
        <h2 className="text-3xl font-bold text-slate-900">Find SafeTag Near Your Exam Center</h2>
        <p className="max-w-2xl text-sm text-slate-500">Thousands of venues. One platform.</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {venues.map((venue) => (
          <Card key={venue._id}>
            <CardContent className="grid gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{venue.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {venue.city}, {venue.state}
                  </p>
                </div>
                <Badge>{formatVenueType(venue.type)}</Badge>
              </div>
              <p className="text-sm text-slate-500">{venue.address}</p>
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Open & Accepting Deposits</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="size-4 text-blue-600" />
                <span>SafeTag Operator</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Button asChild>
          <Link href="/nearby">
            View All Operators Near You
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

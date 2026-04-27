"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Info, MapPin, PackageCheck, Search } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiJson } from "@/lib/api";
import { DEFAULT_ITEM_CATEGORIES } from "@/lib/constants";
import { formatVenueType } from "@/lib/utils";
import { VenueType } from "@/types";

type PublicVenue = {
  _id: string;
  name: string;
  type: VenueType;
  city: string;
  state: string;
  address: string;
  customItemCategories: string[];
};

const filters: Array<{ label: string; value: "all" | VenueType }> = [
  { label: "All", value: "all" },
  { label: "Exam Centers", value: "exam" },
  { label: "Temples", value: "temple" },
  { label: "Parks", value: "park" },
  { label: "Museums", value: "museum" },
  { label: "Religious", value: "religious" },
  { label: "Events", value: "event" }
];

const venueIcons: Record<VenueType, string> = {
  exam: "📚",
  temple: "🛕",
  park: "🌿",
  museum: "🏛️",
  religious: "🕌",
  amusement: "🎡",
  govt: "🏛️",
  event: "🎪"
};

function getDirectionsUrl(venue: PublicVenue) {
  return `https://maps.google.com/?q=${encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.city}, ${venue.state}`)}`;
}

function getMapEmbedUrl(venues: PublicVenue[], search: string) {
  const query =
    search.trim() ||
    venues
      .slice(0, 4)
      .map((venue) => venue.city)
      .join(" ");

  return `https://maps.google.com/maps?q=${encodeURIComponent(`${query || "SafeTag India"} SafeTag operators`)}&output=embed`;
}

export function NearbyOperatorsExplorer() {
  const [venues, setVenues] = useState<PublicVenue[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | VenueType>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadVenues() {
      try {
        const response = await fetch("/api/venues/public");
        const data = await readApiJson<{ venues?: PublicVenue[] }>(response, "Could not load venues");
        if (mounted) setVenues(data.venues ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadVenues();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredVenues = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return venues.filter((venue) => {
      const matchesFilter = activeFilter === "all" ? true : venue.type === activeFilter;
      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      return [venue.name, venue.city, venue.state, venue.address]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeFilter, search, venues]);

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-6 py-10 text-white md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
            Public operator locator
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Find SafeTag Operators Near You
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Locate secure deposit counters near your exam center or destination.
          </p>
        </div>
        <div className="grid gap-4 p-6 md:p-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by city, area or venue name..."
              className="h-14 rounded-2xl border-slate-300 pl-12 text-base"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={
                  activeFilter === filter.value
                    ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm"
                    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600"
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[0.38fr_0.62fr]">
          <div className="bg-blue-50 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Map view
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Operators around your search</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Google Maps preview updates with the searched city or venue area.
            </p>
          </div>
          <iframe
            title="SafeTag operator locations"
            src={getMapEmbedUrl(filteredVenues, search)}
            className="h-[340px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {loading ? (
          <Card className="lg:col-span-2">
            <CardContent className="p-6 text-sm text-slate-500">Loading nearby operators...</CardContent>
          </Card>
        ) : filteredVenues.length ? (
          filteredVenues.map((venue) => {
            const items = venue.customItemCategories?.length
              ? venue.customItemCategories
              : DEFAULT_ITEM_CATEGORIES[venue.type];

            return (
              <Card key={venue._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="grid gap-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="text-3xl">{venueIcons[venue.type]}</span>
                      <div>
                        <h2 className="text-xl font-black text-slate-900">{venue.name}</h2>
                        <Badge className="mt-2 bg-blue-50 text-blue-700 shadow-none">
                          {formatVenueType(venue.type).toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Open
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600">
                    <p className="flex gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-blue-600" />
                      <span>
                        {venue.address}
                        <br />
                        {venue.city}, {venue.state}
                      </span>
                    </p>
                    <p className="flex gap-2">
                      <PackageCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span>Accepts: {items.slice(0, 5).join(", ")}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700">
                      <a href={getDirectionsUrl(venue)} target="_blank" rel="noreferrer">
                        Get Directions
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href={`/nearby?venue=${encodeURIComponent(venue._id)}`}>
                        Details
                        <Info className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="lg:col-span-2">
            <CardContent className="grid gap-4 p-8 text-center">
              <h2 className="text-2xl font-black text-slate-900">
                No operators found{search ? ` in ${search}` : ""} yet.
              </h2>
              <p className="text-sm text-slate-500">Want to be the first? Register your venue →</p>
              <Button asChild className="mx-auto rounded-xl bg-blue-600 hover:bg-blue-700">
                <Link href="/register">Register your venue</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

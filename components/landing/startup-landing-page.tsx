"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Church,
  ExternalLink,
  FerrisWheel,
  GraduationCap,
  Landmark,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Trees
} from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readApiJson } from "@/lib/api";
import { MARKET_STATS, TESTIMONIALS, VENUE_TYPE_META } from "@/lib/constants";
import { formatVenueType } from "@/lib/utils";
import { PublicStats, VenueType } from "@/types";

type PublicVenue = {
  _id: string;
  name: string;
  type: VenueType;
  city: string;
  state: string;
  address: string;
  customItemCategories: string[];
};

const defaultStats: PublicStats = {
  totalVenues: 12,
  approvedVenues: 12,
  citiesCovered: 9,
  totalDeposits: 3,
  liveDeposits: 3,
  venueTypes: 8,
  todayDeposits: 1
};

const venueTypeCards: Array<{
  type: VenueType;
  emoji: string;
  title: string;
  description: string;
}> = [
  { type: "exam", emoji: "📚", title: "Exam Centers", description: "JEE, NEET, SSC, UP Police" },
  { type: "temple", emoji: "🛕", title: "Temples", description: "Pilgrimage & religious sites" },
  { type: "park", emoji: "🌿", title: "National Parks", description: "Wildlife & safari zones" },
  { type: "museum", emoji: "🏛️", title: "Museums", description: "Heritage & cultural sites" },
  { type: "religious", emoji: "🕌", title: "Mosques", description: "Friday prayer venues" },
  { type: "amusement", emoji: "🎡", title: "Amusement Parks", description: "Water parks & theme parks" },
  { type: "govt", emoji: "🏛️", title: "Govt Buildings", description: "Courts, offices, ministries" },
  { type: "event", emoji: "🎪", title: "Events", description: "Concerts, fairs, exhibitions" }
];

const tabContent = {
  visitors: [
    "Walk to counter → No app, no account needed",
    "Staff registers items → Takes 30 seconds",
    "Get QR receipt → On phone + printed slip",
    "Return & collect → Same QR, verified return"
  ],
  venues: [
    "Register free → 5 minutes setup",
    "Add your staff → They get instant access",
    "Start today → Zero hardware purchase"
  ],
  ai: [
    "Photo upload",
    "Google Vision detects items",
    "Items auto-fill with staff override"
  ]
};

const competitorRows = [
  ["Hardware cost", "Manual slips", "₹1-2 lakh/unit", "✅ Zero"],
  ["Setup time", "Immediate", "Weeks", "✅ Same day"],
  ["Exam centers", "✗ No system", "✗ Hardware barrier", "✅ Primary market"],
  ["Tier-2/3 cities", "Paper slips", "✗ Limited", "✅ Everywhere"],
  ["AI item detection", "✗", "✗", "✅ Google Vision"],
  ["Guardian alerts", "✗", "✗", "✅ WhatsApp real-time"],
  ["Photo proof", "✗", "✗", "✅ Built-in"],
  ["Monthly cost", "₹0 but risky", "₹5000+", "✅ ₹499/mo"]
];

const pricingCards = [
  {
    name: "Starter",
    price: "Free forever",
    cta: "Start Free →",
    href: "/register",
    featured: false,
    features: [
      "✅ 50 deposits/month",
      "✅ QR receipts",
      "✅ WhatsApp alerts",
      "✅ Basic analytics",
      "✅ 1 staff member",
      "❌ AI detection",
      "❌ Photo proof"
    ]
  },
  {
    name: "Pro",
    price: "₹499/month",
    cta: "Start 14-day Free Trial →",
    href: "/register",
    featured: true,
    features: [
      "✅ Unlimited deposits",
      "✅ AI item detection",
      "✅ Photo proof system",
      "✅ Advanced analytics",
      "✅ 5 staff members",
      "✅ Priority support",
      "✅ Custom branding"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom pricing",
    cta: "Contact Us →",
    href: "/about#contact",
    featured: false,
    features: [
      "✅ Everything in Pro",
      "✅ Unlimited staff",
      "✅ Multiple locations",
      "✅ API access",
      "✅ Insurance integration",
      "✅ Dedicated manager",
      "✅ Government compliance"
    ]
  }
];

function useCountUp(value: number, active: boolean) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const maxFrames = 36;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / maxFrames, 3);
      setDisplay(Math.round(value * progress));
      if (frame >= maxFrames) window.clearInterval(timer);
    }, 24);

    return () => window.clearInterval(timer);
  }, [active, value]);

  return display;
}

function LiveStat({
  value,
  suffix = "",
  prefix = "",
  label,
  active
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, active);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-3xl font-black text-slate-900">
        {prefix}
        {count}
        {suffix}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

function getDirectionsUrl(venue: PublicVenue) {
  return `https://maps.google.com/?q=${encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.city}, ${venue.state}`)}`;
}

export function StartupLandingPage() {
  const [stats, setStats] = useState<PublicStats>(defaultStats);
  const [venues, setVenues] = useState<PublicVenue[]>([]);
  const [waitlistCount, setWaitlistCount] = useState(47);
  const [activeTab, setActiveTab] = useState<"visitors" | "venues" | "ai">("visitors");
  const [operatorSearch, setOperatorSearch] = useState("");
  const [waitlistForm, setWaitlistForm] = useState({
    email: "",
    phone: "",
    venueName: "",
    city: ""
  });
  const [waitlistStatus, setWaitlistStatus] = useState("");
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStartupData() {
      try {
        const [statsResponse, venuesResponse, waitlistResponse] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/venues/public"),
          fetch("/api/waitlist/count")
        ]);

        const [statsData, venuesData, waitlistData] = await Promise.all([
          readApiJson<PublicStats>(statsResponse, "Could not load stats"),
          readApiJson<{ venues: PublicVenue[] }>(venuesResponse, "Could not load venues"),
          readApiJson<{ count: number }>(waitlistResponse, "Could not load waitlist count")
        ]);

        if (!mounted) return;
        setStats(statsData);
        setVenues(venuesData.venues ?? []);
        setWaitlistCount(waitlistData.count ?? 47);
      } catch (error) {
        console.error(error);
      }
    }

    loadStartupData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );

    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const filteredVenues = useMemo(() => {
    const query = operatorSearch.trim().toLowerCase();
    const list = query
      ? venues.filter((venue) =>
          [venue.name, venue.city, venue.state, venue.address].join(" ").toLowerCase().includes(query)
        )
      : venues;

    return list.slice(0, 3);
  }, [operatorSearch, venues]);

  const venueCounts = useMemo(() => {
    return venues.reduce<Record<string, number>>((counts, venue) => {
      counts[venue.type] = (counts[venue.type] ?? 0) + 1;
      return counts;
    }, {});
  }, [venues]);

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingWaitlist(true);
    setWaitlistStatus("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...waitlistForm, venueType: "exam" })
      });
      const data = await readApiJson<{ position: number }>(response, "Could not join waitlist");
      setWaitlistStatus(`✅ You're on the list! We'll be in touch. Position #${data.position}`);
      setWaitlistCount((count) => Math.max(count + 1, data.position));
      toast.success("Waitlist joined successfully");
      setWaitlistForm({ email: "", phone: "", venueName: "", city: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join waitlist");
    } finally {
      setSubmittingWaitlist(false);
    }
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SafeTag",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://safetag.vercel.app",
    offers: { "@type": "Offer", price: "499", priceCurrency: "INR" }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-white">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(#bfdbfe 1px, transparent 1px)",
              backgroundSize: "22px 22px"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/90 to-blue-50/90" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:min-h-[calc(100svh-64px)] lg:grid-cols-[0.58fr_0.42fr]">
            <div>
              <div className="inline-flex animate-pulse items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                🇮🇳 Now live in 9 cities · 12 venues · HackDiwas 3.0 Finalist
              </div>
              <h1 className="mt-6 text-balance text-5xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Your belongings, safe.
                <span className="block bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                  Your mind, free.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">
                India's first QR-based secure deposit system for temples, exam centers, parks and museums. Zero hardware. Instant setup.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="group rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl">
                  <Link href="/register">
                    Register Your Venue Free
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl border-slate-300 px-6 py-3 font-medium text-slate-700 transition-all hover:bg-slate-50">
                  <Link href="/whatsapp-demo">
                    <PlayCircle className="size-4" />
                    Watch Demo
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {["✅ Zero Hardware", "🤖 AI Detection", "💬 WhatsApp Alerts", "🔐 QR Secured", "⚡ Same-Day Setup"].map((pill) => (
                  <span key={pill} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl">
              <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Live receipt</p>
                    <p className="mt-2 text-2xl font-black">ST-EXAM-00012</p>
                  </div>
                  <ShieldCheck className="size-10 text-emerald-400" />
                </div>
                <div className="mt-6 rounded-2xl bg-white p-5 text-slate-900">
                  <div
                    className="mx-auto flex size-36 items-center justify-center rounded-2xl border-4 border-blue-600 bg-slate-50"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #0f172a 25%, transparent 25%), linear-gradient(-45deg, #0f172a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f172a 75%), linear-gradient(-45deg, transparent 75%, #0f172a 75%)",
                      backgroundSize: "24px 24px",
                      backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0"
                    }}
                  >
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-600">QR</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {["Mobile Phone", "Wallet", "Watch"].map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium">
                        <span>{item}</span>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                  💬 Guardian notified on WhatsApp · Photo proof stored
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={statsRef} className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-4 md:grid-cols-4">
            <LiveStat value={stats.approvedVenues} label="Venues Live" active={statsVisible} />
            <LiveStat value={stats.citiesCovered} label="Cities" active={statsVisible} />
            <LiveStat value={0} prefix="₹" label="Hardware Needed" active={statsVisible} />
            <LiveStat value={86} suffix="L+" label="Students Need This" active={statsVisible} />
          </div>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Trusted by venues across India</p>
            <p className="mt-3 text-sm font-bold text-slate-800">
              DPS Computer Center · Kashi Vishwanath · Jim Corbett · National Museum · Ram Mandir · +7 more
            </p>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">How it works</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">One flow, every venue type</h2>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              ["visitors", "For Visitors"],
              ["venues", "For Venues"],
              ["ai", "AI Detection"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value as "visitors" | "venues" | "ai")}
                className={
                  activeTab === value
                    ? "rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-sm"
                    : "rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-500"
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {tabContent[activeTab].map((step, index) => (
              <div key={step} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-lg font-black text-blue-600">
                  {index + 1}
                </div>
                <p className="mt-5 text-sm font-semibold leading-6 text-slate-700">{step}</p>
                {index < tabContent[activeTab].length - 1 ? (
                  <div className="absolute left-11 top-11 hidden h-px w-full bg-blue-100 lg:block" />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Venue types</p>
                <h2 className="mt-3 text-4xl font-black text-slate-900">Built for India’s real counters</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-500">Each card maps to custom item categories, thermal receipts, and staff flows.</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {venueTypeCards.map((card) => (
                <div key={card.type} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-md">
                  <div className="text-3xl">{card.emoji}</div>
                  <h3 className="mt-4 font-bold text-slate-800">{card.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{card.description}</p>
                  <p className="mt-4 text-xs font-bold text-blue-600">{venueCounts[card.type] ?? 0} venues active</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">India problem</p>
            <h2 className="mt-3 text-4xl font-black">The gap is massive.</h2>
            <p className="mt-3 text-slate-300">10 lakh+ venues. Zero digital systems.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MARKET_STATS.slice(0, 6).map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-2xl font-black text-emerald-400">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between">
              <p className="text-lg font-bold">Standard digital belongings systems: 0</p>
              <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700">
                <Link href="/register">SafeTag is solving this. Join us.</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Comparison</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">Why venues choose SafeTag</h2>
          </div>
          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-4 bg-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white">
              <span>Feature</span>
              <span>Traditional</span>
              <span>SafeCloak/Tuckit</span>
              <span>SafeTag</span>
            </div>
            {competitorRows.map((row, index) => (
              <div key={row[0]} className={`grid grid-cols-4 px-4 py-4 text-sm ${index % 2 ? "bg-slate-50" : "bg-white"}`}>
                <span className="font-semibold text-slate-800">{row[0]}</span>
                <span className="text-slate-400">{row[1]}</span>
                <span className="text-slate-400">{row[2]}</span>
                <span className="font-bold text-blue-600">{row[3]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Find operators</p>
                <h2 className="mt-3 text-4xl font-black text-slate-900">Find SafeTag near your exam center</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">Thousands of venues. One platform.</p>
                <Input
                  className="mt-6 h-12 rounded-xl"
                  value={operatorSearch}
                  onChange={(event) => setOperatorSearch(event.target.value)}
                  placeholder="Enter your city or exam center..."
                />
                <Link href="/nearby" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                  View all operators
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="grid gap-4">
                {(filteredVenues.length ? filteredVenues : venues.slice(0, 3)).map((venue) => (
                  <div key={venue._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800">{venue.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{venue.city}, {venue.state}</p>
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 shadow-none">{formatVenueType(venue.type)}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-emerald-600">Open ✅</span>
                      <a href={getDirectionsUrl(venue)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                        Get Directions
                        <ExternalLink className="size-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Pricing</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">Simple, transparent pricing</h2>
            <p className="mt-3 text-sm text-slate-500">Start free. Upgrade when you grow.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {pricingCards.map((plan) => (
              <div key={plan.name} className={`relative rounded-3xl border p-6 shadow-sm ${plan.featured ? "border-blue-500 bg-slate-950 text-white shadow-xl" : "border-slate-200 bg-white text-slate-900"}`}>
                {plan.featured ? (
                  <span className="absolute right-5 top-5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">⭐ Most Popular</span>
                ) : null}
                <h3 className="text-2xl font-black">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.featured ? "text-slate-300" : "text-slate-500"}`}>{plan.price}</p>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <p key={feature} className={`text-sm ${plan.featured ? "text-slate-100" : "text-slate-600"}`}>{feature}</p>
                  ))}
                </div>
                <Button asChild className={`mt-8 w-full rounded-xl ${plan.featured ? "bg-blue-600 hover:bg-blue-700" : ""}`} variant={plan.featured ? "default" : "outline"}>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Testimonials</p>
              <h2 className="mt-3 text-4xl font-black text-slate-900">Built with operators, trusted by venues</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((testimonial) => (
                <div key={testimonial.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-5 text-sm italic leading-6 text-slate-600">“{testimonial.quote}”</p>
                  <p className="mt-5 font-bold text-slate-800">{testimonial.name}</p>
                  <p className="text-xs text-slate-400">{testimonial.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.38fr_0.62fr] lg:items-center">
              <div>
                <BadgeCheck className="size-10 text-emerald-400" />
                <h2 className="mt-4 text-4xl font-black">Be among our first 100 venues</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">Early venues get 6 months Pro plan free.</p>
                <p className="mt-5 text-sm font-bold text-emerald-300">Join {waitlistCount}+ venues already on waitlist</p>
              </div>
              <form onSubmit={submitWaitlist} className="grid gap-3 md:grid-cols-2">
                <Input required type="email" value={waitlistForm.email} onChange={(event) => setWaitlistForm((form) => ({ ...form, email: event.target.value }))} placeholder="Email" className="h-12 rounded-xl border-white/20 bg-white text-slate-900" />
                <Input required value={waitlistForm.phone} onChange={(event) => setWaitlistForm((form) => ({ ...form, phone: event.target.value }))} placeholder="Phone number" className="h-12 rounded-xl border-white/20 bg-white text-slate-900" />
                <Input required value={waitlistForm.venueName} onChange={(event) => setWaitlistForm((form) => ({ ...form, venueName: event.target.value }))} placeholder="Venue name" className="h-12 rounded-xl border-white/20 bg-white text-slate-900" />
                <Input required value={waitlistForm.city} onChange={(event) => setWaitlistForm((form) => ({ ...form, city: event.target.value }))} placeholder="City" className="h-12 rounded-xl border-white/20 bg-white text-slate-900" />
                <Button disabled={submittingWaitlist} className="h-12 rounded-xl bg-emerald-500 font-bold text-white hover:bg-emerald-600 md:col-span-2">
                  {submittingWaitlist ? "Joining..." : "Join Waitlist →"}
                </Button>
                {waitlistStatus ? <p className="text-sm font-semibold text-emerald-300 md:col-span-2">{waitlistStatus}</p> : null}
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  MonitorSmartphone,
  PlayCircle,
  ShieldCheck,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readApiJson } from "@/lib/api";
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
  totalVenues: 11,
  approvedVenues: 11,
  citiesCovered: 11,
  totalDeposits: 0,
  liveDeposits: 0,
  venueTypes: 8,
  todayDeposits: 0,
  itemsSecured: 0
};

const venueTypeCards: Array<{
  type: VenueType;
  emoji: string;
  title: string;
  subtitle: string;
  examples: string;
}> = [
  { type: "exam", emoji: "📚", title: "Exam Centers", subtitle: "JEE · NEET · SSC · UP Police", examples: "CBT labs, coaching hubs, exam gates" },
  { type: "temple", emoji: "🛕", title: "Temples & Shrines", subtitle: "Ram Mandir · Kashi · Tirupati", examples: "Darshan counters and pilgrim queues" },
  { type: "park", emoji: "🌿", title: "National Parks", subtitle: "Corbett · Ranthambore · Dudhwa", examples: "Safari gates and wildlife zones" },
  { type: "museum", emoji: "🏛️", title: "Museums", subtitle: "National Museum · Indian Museum", examples: "Heritage and cultural sites" },
  { type: "religious", emoji: "🕌", title: "Religious Places", subtitle: "Gurudwaras · Mosques · Churches", examples: "Community spaces and prayer venues" },
  { type: "amusement", emoji: "🎡", title: "Amusement Parks", subtitle: "Wonderla · Imagicaa · Water Parks", examples: "Ride entrances and wet zones" },
  { type: "govt", emoji: "🏛️", title: "Govt Buildings", subtitle: "Courts · Rashtrapati Bhavan", examples: "Offices, ministries and secure entries" },
  { type: "event", emoji: "🎪", title: "Events & Concerts", subtitle: "Festivals · Sports · Conferences", examples: "Temporary counters and VIP events" }
];

const visitorSteps = [
  "Walk to any SafeTag counter",
  "Staff scans and registers your items",
  "Get instant QR slip + WhatsApp receipt",
  "Show QR to collect your items anytime"
];

const venueSteps = [
  "Register free in under 5 minutes",
  "Add your staff — they get instant access",
  "Accept deposits at your counter",
  "Track everything on live dashboard"
];

const marketStats = [
  ["7,50,000+", "Temples in India"],
  ["3,00,000+", "Mosques in India"],
  ["7,657", "Gurudwaras"],
  ["86 Lakh+", "Exam Students yearly"],
  ["1,001+", "Amusement Parks"],
  ["0", "Proper digital systems"]
];

const comparisonRows = [
  ["Hardware Cost", "₹1–2 lakh/unit", "₹0 ✅"],
  ["Setup Time", "Weeks", "Same day ✅"],
  ["Exam Centers", "✗ Not served", "✅ Primary market"],
  ["Tier-2/3 Cities", "✗ Limited", "✅ Everywhere"],
  ["AI Detection", "✗ None", "✅ Google Vision"],
  ["Guardian Alerts", "✗ None", "✅ WhatsApp"],
  ["Operator Device", "Custom terminal", "Any phone ✅"]
];

const pricingCards = [
  {
    name: "Starter",
    price: "Free",
    cta: "Get Started Free",
    href: "/register",
    featured: false,
    features: [
      "Up to 100 deposits/month",
      "QR receipts",
      "WhatsApp alerts (visitor)",
      "Basic dashboard",
      "1 operator account"
    ]
  },
  {
    name: "Pro",
    price: "₹499/month",
    cta: "Start 14-day Free Trial",
    href: "/register",
    featured: true,
    features: [
      "Unlimited deposits",
      "AI item detection",
      "Guardian WhatsApp alerts",
      "Advanced analytics",
      "Up to 5 operators",
      "Priority support",
      "Custom branding on receipts"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    cta: "Contact Us",
    href: "/about#contact",
    featured: false,
    features: [
      "Multiple locations",
      "API access",
      "Insurance integration",
      "Govt compliance reports",
      "Dedicated account manager",
      "Custom integrations"
    ]
  }
];

const testimonials = [
  {
    quote: "Students aur parents dono ko WhatsApp receipt milti hai — isliye panic calls almost band ho gaye.",
    name: "Sajid Khan",
    role: "Exam Center Coordinator, Lucknow"
  },
  {
    quote: "Manual slips ke jagah photo proof aur QR — trust turant improve hua.",
    name: "Ritu Sharma",
    role: "Temple Operations Lead, Ayodhya"
  },
  {
    quote: "No hardware, no counter rebuild. Existing staff ne ek din mein system adopt kar liya.",
    name: "Arjun Nair",
    role: "Wildlife Gate Manager, Ramnagar"
  }
];

function useCountUp(value: number, active: boolean) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const maxFrames = 40;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / maxFrames, 3);
      setDisplay(Math.round(value * progress));
      if (frame >= maxFrames) window.clearInterval(timer);
    }, 22);

    return () => window.clearInterval(timer);
  }, [active, value]);

  return display;
}

function LiveStat({
  value,
  label,
  active,
  suffix = "",
  prefix = ""
}: {
  value: number;
  label: string;
  active: boolean;
  suffix?: string;
  prefix?: string;
}) {
  const count = useCountUp(value, active);

  return (
    <div className="text-center">
      <p className="text-3xl font-black text-white md:text-4xl">
        {prefix}
        {count}
        {suffix}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-300">{label}</p>
    </div>
  );
}

function getDirectionsUrl(venue: PublicVenue) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${venue.name} ${venue.address} ${venue.city} SafeTag`)}`;
}

export function StartupLandingPage() {
  const [stats, setStats] = useState<PublicStats>(defaultStats);
  const [venues, setVenues] = useState<PublicVenue[]>([]);
  const [waitlistCount, setWaitlistCount] = useState(47);
  const [activeTab, setActiveTab] = useState<"visitors" | "venues">("visitors");
  const [operatorSearch, setOperatorSearch] = useState("");
  const [waitlistForm, setWaitlistForm] = useState({
    email: "",
    phone: "",
    venueName: "",
    venueType: "exam" as VenueType,
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
        body: JSON.stringify(waitlistForm)
      });
      const data = await readApiJson<{ position: number }>(response, "Could not join waitlist");
      setWaitlistStatus("You're on the list! 🎉 We'll WhatsApp you within 24 hours.");
      setWaitlistCount((count) => Math.max(count + 1, data.position));
      toast.success("Waitlist joined successfully");
      setWaitlistForm({ email: "", phone: "", venueName: "", venueType: "exam", city: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join waitlist");
    } finally {
      setSubmittingWaitlist(false);
    }
  }

  const steps = activeTab === "visitors" ? visitorSteps : venueSteps;
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
      <style jsx global>{`
        @keyframes safetag-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
      `}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <main>
        <section className="relative min-h-[calc(100svh-64px)] overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(8,145,178,0.24),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.24),transparent_30%)]" />
          <div className="relative mx-auto grid min-h-[calc(100svh-64px)] max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.55fr_0.45fr]">
            <div>
              <div className="inline-flex animate-pulse items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-sm font-semibold text-blue-100">
                🇮🇳 Now live in 11 cities across India
              </div>
              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
                Your belongings are{" "}
                <span className="bg-gradient-to-r from-cyan-300 to-teal-400 bg-clip-text text-transparent">safe</span>.
                <span className="mt-2 block">Your mind is free.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-xl leading-8 text-slate-300">
                India's first QR-based secure deposit system for temples, exam centers, parks and museums. Zero hardware. Instant setup. WhatsApp alerts.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="group rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500">
                  <Link href="/register">
                    Register Your Venue Free
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl border-slate-600 bg-transparent px-8 py-4 text-lg font-semibold text-slate-300 hover:border-slate-400 hover:bg-white/5 hover:text-white">
                  <Link href="/whatsapp-demo">
                    Watch 2-min Demo
                    <PlayCircle className="size-5" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {["🔐 AI Verified", "📱 QR Secured", "💬 WhatsApp Alerts", "⚡ Zero Hardware"].map((pill) => (
                  <span key={pill} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block" style={{ animation: "safetag-float 3s ease-in-out infinite" }}>
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
                <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white ring-1 ring-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Live dashboard</p>
                      <p className="mt-2 text-2xl font-black">DPS Computer Center</p>
                    </div>
                    <MonitorSmartphone className="size-10 text-teal-300" />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                      ["24", "In custody"],
                      ["18", "Returned"],
                      ["02", "Overdue"],
                      ["42", "Today"]
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-2xl font-black text-white">{value}</p>
                        <p className="text-xs text-slate-300">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl bg-white p-5 text-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Receipt</p>
                        <p className="mt-1 font-mono text-xl font-black">ST-EXAM-00012</p>
                      </div>
                      <ShieldCheck className="size-9 text-teal-500" />
                    </div>
                    <div className="mt-5 space-y-2">
                      {["Mobile", "Wallet", "Watch"].map((item) => (
                        <div key={item} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold">
                          {item}
                          <CheckCircle2 className="size-4 text-teal-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-teal-400/20 bg-teal-400/10 p-4 text-sm font-semibold text-teal-100">
                    WhatsApp sent · QR secured · Photo proof saved
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={statsRef} className="border-y border-slate-700/50 bg-slate-800 py-8">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-4">
            <LiveStat value={stats.approvedVenues} suffix="+" label="Approved Venues" active={statsVisible} />
            <LiveStat value={stats.citiesCovered} label="Cities Live" active={statsVisible} />
            <LiveStat value={stats.itemsSecured} suffix="+" label="Items Secured" active={statsVisible} />
            <div className="text-center">
              <p className="text-3xl font-black text-white md:text-4xl">₹0</p>
              <p className="mt-2 text-sm font-semibold text-slate-300">Hardware Cost</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-600">How it works</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Dead simple. For everyone.</h2>
          </div>
          <div className="mt-8 flex justify-center gap-2">
            {[
              ["visitors", "For Visitors"],
              ["venues", "For Venues"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value as "visitors" | "venues")}
                className={
                  activeTab === value
                    ? "rounded-full bg-[#1E3A8A] px-5 py-2 text-sm font-bold text-white shadow-sm"
                    : "rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-500"
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="flex size-11 items-center justify-center rounded-full bg-cyan-50 text-lg font-black text-cyan-700">
                  {index + 1}
                </div>
                <p className="mt-5 text-sm font-semibold leading-6 text-slate-700">{step}</p>
                {index < steps.length - 1 ? (
                  <div className="absolute left-12 top-11 hidden h-px w-full bg-cyan-100 lg:block" />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-600">Venue types</p>
              <h2 className="mt-3 text-4xl font-black text-slate-900">Built for real India</h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {venueTypeCards.map((card) => (
                <div key={card.type} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-2 hover:border-cyan-400 hover:shadow-xl">
                  <div className="text-4xl transition-transform group-hover:scale-110">{card.emoji}</div>
                  <h3 className="mt-4 font-black text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-600">{card.subtitle}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{card.examples}</p>
                  <p className="mt-4 text-xs font-bold text-cyan-700">{venueCounts[card.type] ?? 0} venues active</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-slate-900 to-blue-950 py-20 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
              The gap is massive.
              <span className="block text-cyan-300">The digital solution barely existed.</span>
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {marketStats.map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <p className="text-3xl font-black text-teal-300">{value}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-300">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Data: IIT Bombay, NTA Official, WII, GlobeNewsWire
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-600">Comparison</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">Why venues choose SafeTag</h2>
          </div>
          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 bg-slate-900 px-4 py-4 text-xs font-bold uppercase tracking-wide text-white">
              <span>Criteria</span>
              <span>SafeCloak/Tuckit</span>
              <span>SafeTag</span>
            </div>
            {comparisonRows.map((row, index) => (
              <div key={row[0]} className={`grid grid-cols-3 px-4 py-5 text-sm ${index % 2 ? "bg-slate-50" : "bg-white"}`}>
                <span className="font-semibold text-slate-800">{row[0]}</span>
                <span className="text-slate-500">{row[1]}</span>
                <span className="font-black text-[#1E3A8A]">{row[2]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-600">Find operators</p>
              <h2 className="mt-3 text-4xl font-black text-slate-900">Find SafeTag near your exam center</h2>
              <Input
                className="mt-6 h-12 rounded-xl"
                value={operatorSearch}
                onChange={(event) => setOperatorSearch(event.target.value)}
                placeholder="Search by city or exam center..."
              />
              <Link href="/nearby" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1E3A8A]">
                View all operators
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {(filteredVenues.length ? filteredVenues : venues.slice(0, 3)).map((venue) => (
                <div key={venue._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-900">🏫 {venue.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">📍 {venue.city}, {venue.state}</p>
                    </div>
                    <Badge className="bg-cyan-50 text-cyan-700 shadow-none">{formatVenueType(venue.type)}</Badge>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-emerald-600">🟢 Open & Accepting Deposits</p>
                  <p className="mt-2 text-sm text-slate-500">
                    📦 {venue.customItemCategories.slice(0, 4).join(" · ")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a href={getDirectionsUrl(venue)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2 text-sm font-bold text-white">
                      Get Directions
                      <ExternalLink className="size-4" />
                    </a>
                    <Link href={`/nearby?venue=${encodeURIComponent(venue._id)}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-600">Pricing</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">Simple, honest pricing</h2>
            <p className="mt-3 text-sm text-slate-500">Start free. Scale as you grow.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {pricingCards.map((plan) => (
              <div key={plan.name} className={`relative rounded-3xl border p-6 shadow-sm ${plan.featured ? "border-cyan-400 bg-slate-950 text-white shadow-2xl" : "border-slate-200 bg-white text-slate-900"}`}>
                {plan.featured ? (
                  <span className="absolute right-5 top-5 rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">Most Popular</span>
                ) : null}
                <h3 className="text-2xl font-black uppercase">{plan.name}</h3>
                <p className={`mt-2 text-3xl font-black ${plan.featured ? "text-cyan-300" : "text-[#1E3A8A]"}`}>{plan.price}</p>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <p key={feature} className={`text-sm ${plan.featured ? "text-slate-100" : "text-slate-600"}`}>✓ {feature}</p>
                  ))}
                </div>
                <Button asChild className={`mt-8 w-full rounded-xl ${plan.featured ? "bg-blue-600 hover:bg-blue-500" : ""}`} variant={plan.featured ? "default" : "outline"}>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-5 text-sm italic leading-6 text-slate-600">“{testimonial.quote}”</p>
                  <p className="mt-5 font-black text-slate-900">— {testimonial.name}</p>
                  <p className="text-xs text-slate-400">{testimonial.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-blue-600 py-20 text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[0.38fr_0.62fr] lg:items-center">
            <div>
              <BadgeCheck className="size-11 text-cyan-200" />
              <h2 className="mt-4 text-4xl font-black">Be among the first 100 venues</h2>
              <p className="mt-3 text-sm leading-6 text-blue-100">Early venues get 6 months Pro free</p>
              <p className="mt-5 text-sm font-bold text-cyan-100">Join {waitlistCount}+ venues already waiting</p>
            </div>
            <form onSubmit={submitWaitlist} className="grid gap-3 md:grid-cols-2">
              <Input required type="email" value={waitlistForm.email} onChange={(event) => setWaitlistForm((form) => ({ ...form, email: event.target.value }))} placeholder="Email" className="h-12 rounded-xl border-white/20 bg-white text-slate-900" />
              <Input required value={waitlistForm.phone} onChange={(event) => setWaitlistForm((form) => ({ ...form, phone: event.target.value }))} placeholder="Phone number" className="h-12 rounded-xl border-white/20 bg-white text-slate-900" />
              <Input required value={waitlistForm.venueName} onChange={(event) => setWaitlistForm((form) => ({ ...form, venueName: event.target.value }))} placeholder="Venue name" className="h-12 rounded-xl border-white/20 bg-white text-slate-900" />
              <select
                value={waitlistForm.venueType}
                onChange={(event) => setWaitlistForm((form) => ({ ...form, venueType: event.target.value as VenueType }))}
                className="h-12 rounded-xl border border-white/20 bg-white px-3 text-sm text-slate-900 outline-none"
              >
                {venueTypeCards.map((venue) => (
                  <option key={venue.type} value={venue.type}>{venue.title}</option>
                ))}
              </select>
              <Input required value={waitlistForm.city} onChange={(event) => setWaitlistForm((form) => ({ ...form, city: event.target.value }))} placeholder="City" className="h-12 rounded-xl border-white/20 bg-white text-slate-900 md:col-span-2" />
              <Button disabled={submittingWaitlist} className="h-12 rounded-xl bg-teal-500 font-bold text-white hover:bg-teal-400 md:col-span-2">
                {submittingWaitlist ? "Joining..." : "Join Waitlist →"}
              </Button>
              {waitlistStatus ? <p className="text-sm font-semibold text-cyan-100 md:col-span-2">{waitlistStatus}</p> : null}
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

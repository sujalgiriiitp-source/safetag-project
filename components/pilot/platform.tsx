"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/shared/navbar";
import { readApiJson } from "@/lib/api";
type PlatformData = {
  venues: { _id: string; name: string; city: string; address: string; contactName: string }[];
  reviews: { venueId: string; review: string }[]; totalDeposits: number;
  jobs: { _id: string; count: number }[]; platformRevenue: string;
  audit: { _id: string; action: string; at: string; reason: string }[];
};
export function PilotPlatform() {
  const router = useRouter();
  const [data, setData] = useState<PlatformData | null>(null), [reason, setReason] = useState("");
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function load() { setData(await readApiJson<PlatformData>(await fetch("/api/pilot/platform"), "Platform workspace unavailable")); }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pilot/platform", { signal: controller.signal })
      .then((res) => readApiJson<PlatformData>(res, "Platform workspace unavailable"))
      .then((value) => { if (!controller.signal.aborted) setData(value); })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, []);
  async function review(venueId: string, value: string) {
    setBusy(true); setError("");
    try { await readApiJson(await fetch("/api/pilot/platform", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ venueId, review: value, reason }) }), "Review failed"); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Review failed"); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-slate-50 text-slate-900"><Navbar /><main className="mx-auto max-w-6xl space-y-6 px-4 py-8"><header className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Platform administration</p><h1 className="mt-2 text-3xl font-bold">Venue review and pilot health</h1></div><Button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }}>Logout</Button></header>{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}<div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-white p-5"><p className="text-3xl font-bold">{data?.totalDeposits || 0}</p><p>Pilot deposits</p></div><div className="rounded-xl border bg-white p-5"><p className="font-bold">Platform revenue</p><p className="mt-2 text-sm">{data?.platformRevenue}</p></div><div className="rounded-xl border bg-white p-5"><h2 className="font-bold">Notification job health</h2>{data?.jobs.map((j) => <p key={j._id} className="text-sm">{j._id}: {j.count}</p>)}</div></div><label className="grid gap-2 text-sm font-bold">Review reason and operational verification (required)<Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Checked storage room, owner identity, hours and pilot agreement..." /></label><section className="grid gap-4 md:grid-cols-2">{data?.venues.map((venue) => <article key={venue._id} className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">{venue.name}</h2><p className="mt-1 text-sm">{venue.city} · {venue.address}</p><p className="mt-2 text-sm">Contact: {venue.contactName}</p><p className="mt-3 font-bold text-cyan-800">{data.reviews.find((r) => r.venueId === venue._id)?.review || "Unreviewed: not a verified partner"}</p><div className="mt-4 flex flex-wrap gap-2">{["approved", "rejected", "suspended", "pending"].map((value) => <Button key={value} size="sm" variant="outline" disabled={busy || reason.length < 10} onClick={() => review(venue._id, value)}>{value}</Button>)}</div></article>)}</section><section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Administrative audit</h2><ul className="mt-4 space-y-3 text-sm">{data?.audit.map((v) => <li key={v._id}>{new Date(v.at).toISOString()} · {v.action} · {v.reason}</li>)}</ul></section></main></div>;
}

"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Camera, Package, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { readApiJson } from "@/lib/api";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustodyItem, VenueOperations } from "@/types/pilot";
import type { custodyView } from "@/lib/pilot/custody";

const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner), { ssr: false });
type RecordView = ReturnType<typeof custodyView>;
type Workspace = {
  actor: { name: string; role: string; operatorId: string }; venue: { name: string; city: string };
  operations: VenueOperations | null; occupied: string[]; records: RecordView[]; page: number; total: number;
  staff: { _id: string; name: string; phone: string; role: string; isActive: boolean }[];
  stats: { _id: string; count: number; collectedPaise: number }[]; integrations: Record<string, string | boolean>;
};
const newItem = (): CustodyItem => ({ name: "Mobile Phone", quantity: 1, condition: "No visible damage", notes: "" });
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount / 100);
const date = (value: unknown) => new Date(String(value)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
function subscribeOnline(update: () => void) {
  window.addEventListener("online", update); window.addEventListener("offline", update);
  return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
}
const onlineSnapshot = () => navigator.onLine;
const serverOnlineSnapshot = () => true;

export function PilotWorkspace() {
  const router = useRouter();
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const online = useSyncExternalStore(subscribeOnline, onlineSnapshot, serverOnlineSnapshot);
  const [now, setNow] = useState(0);
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState(""); const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RecordView | null>(null);
  const [receipt, setReceipt] = useState<{ receiptPath: string; collectionCode: string } | null>(null);
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID()); const [returnKey, setReturnKey] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState({ visitorName: "", visitorPhone: "", guardianPhone: "", visitorConsent: false, guardianConsent: false });
  const [items, setItems] = useState<CustodyItem[]>([newItem()]);
  const [photoAsset, setPhotoAsset] = useState(""); const [location, setLocation] = useState("");
  const [collectionCode, setCollectionCode] = useState(""); const [verified, setVerified] = useState(false);
  const [scanning, setScanning] = useState(false); const [reason, setReason] = useState(""); const [verification, setVerification] = useState("");
  const [printer, setPrinter] = useState<"58mm" | "80mm">("80mm");
  const [config, setConfig] = useState({ hours: "08:00 - 20:00", locations: "A-01\nA-02", acceptedItems: "Mobile Phone\nWallet\nBag", prohibitedItems: "Weapons\nHazardous materials", feePaise: 0, pricingTerms: "Flat fee per deposit; ask staff about closing time.", retentionDays: 30 });
  const [invite, setInvite] = useState({ name: "", phone: "", role: "operator" }); const [inviteToken, setInviteToken] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/pilot/workspace?page=${page}&state=${encodeURIComponent(filter)}&q=${encodeURIComponent(search)}`, { cache: "no-store" });
    const next = await readApiJson<Workspace>(res, "Workspace could not load"); setData(next);
  }, [filter, page, search]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/pilot/workspace?page=${page}&state=${encodeURIComponent(filter)}&q=${encodeURIComponent(search)}`, { cache: "no-store", signal: controller.signal })
      .then((res) => readApiJson<Workspace>(res, "Workspace could not load"))
      .then((next) => { if (!controller.signal.aborted) { setData(next); setNow(Date.now()); } })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [page, filter, search]);

  async function run(work: () => Promise<void>) {
    if (!online) { setError("Internet required. Action not submitted / Offline mein record confirm nahi hua."); return; }
    setBusy(true); setError(""); setNotice("");
    try { await work(); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Action failed. Retry with the same request."); } finally { setBusy(false); }
  }
  async function send<T>(url: string, body: unknown): Promise<T> {
    return readApiJson<T>(await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), "Request failed");
  }
  async function action(body: unknown) {
    if (!selected) return;
    const result = await send<{ record: RecordView; collectionCode?: string }>(`/api/pilot/deposits/${selected.id}`, body);
    setSelected(result.record);
    if (result.record.state !== selected.state) setVerified(false);
    if (result.collectionCode) { setReceipt((current) => current ? { ...current, collectionCode: result.collectionCode! } : { receiptPath: "", collectionCode: result.collectionCode! }); setNotice("Old collection coupon invalidated. Give the new coupon only to the verified visitor."); }
    else setNotice("Server confirmed / Record save ho gaya");
  }
  async function checkin(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const result = await send<{ record: RecordView; receiptPath: string; collectionCode: string }>("/api/pilot/deposits", { ...form, items, requestKey });
      setSelected(result.record); setReceipt(result); setPhotoAsset(""); setLocation(""); setVerified(false);
      setNotice("REGISTERED only. Take photo, inspect items and confirm physical storage before issuing the custody slip.");
    });
  }
  async function upload(file?: File) {
    if (!file || !selected) return;
    await run(async () => {
      if (file.size > 5 * 1024 * 1024) throw new Error("Photo must be under 5 MB");
      const imageBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await send<{ assetId: string }>("/api/pilot/assets", { custodyId: selected.id, imageBase64 });
      setPhotoAsset(result.assetId); setNotice("Private photo saved. Inspect actual items before acceptance.");
    });
  }
  async function selectRecord(record: RecordView) {
    setSelected(record); setReceipt(null); setPhotoAsset(record.photoPath?.split("/").pop() || "");
    setCollectionCode(""); setVerified(false); setReturnKey(crypto.randomUUID());
    const res = await readApiJson<{ receiptPath: string }>(await fetch(`/api/pilot/deposits/${record.id}`), "Receipt unavailable");
    setReceipt({ receiptPath: res.receiptPath, collectionCode: "" });
  }
  function scan(value: string) {
    const match = value.match(/^STC:([a-f0-9-]{36}):([A-Za-z0-9_-]{43})$/i);
    if (!match) { setError("Scan the separate collection coupon, not the public receipt QR"); setScanning(false); return; }
    run(async () => {
      const found = await readApiJson<{ record: RecordView; receiptPath: string }>(await fetch(`/api/pilot/deposits/${match[1]}`), "Deposit not found for this venue");
      setSelected(found.record); setReceipt({ receiptPath: found.receiptPath, collectionCode: "" }); setCollectionCode(match[2]); setVerified(false); setReturnKey(crypto.randomUUID());
    });
    setScanning(false);
  }
  const label = "grid gap-1.5 text-sm font-semibold text-slate-700";
  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
  const manager = data?.actor.role === "admin";

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <div className="pilot-no-print"><Navbar /></div>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="pilot-no-print space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">SafeTag · Controlled pilot</p><h1 className="mt-2 text-3xl font-bold">{data?.venue.name || "Counter workspace"}</h1><p className="mt-2 text-sm text-slate-600">{data?.actor.name} · {data?.actor.role} · Online confirmation required</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => run(load)}><RefreshCw className="size-4" />Refresh</Button><Button variant="outline" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }}>Logout</Button><Button asChild variant="outline"><Link href="/dashboard">Legacy records</Link></Button></div>
        </header>
        <p role="status" className={`rounded-xl border px-4 py-3 text-sm font-semibold ${online ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-red-300 bg-red-50 text-red-900"}`}>{online ? "Online / Internet connected" : "OFFLINE: no check-in or return is confirmed. Follow numbered paper outage procedure."}</p>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{error}<button className="ml-3 underline" onClick={() => run(load)}>Retry</button></div>}
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{notice}</p>}
        {data && <><section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{["REGISTERED", "STORED", "RETURNED", "CANCELLED"].map((state) => <div key={state} className={`${card} border-l-4 ${state === "STORED" ? "border-l-blue-700" : state === "RETURNED" ? "border-l-emerald-500" : "border-l-slate-300"}`}><p className="text-3xl font-bold">{data.stats.find((entry) => entry._id === state)?.count || 0}</p><p className="text-xs font-bold tracking-wide text-slate-500">{state}</p></div>)}</section>
          <details className={card}><summary className="cursor-pointer font-bold">Integration and shift status</summary><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{Object.entries(data.integrations).map(([key, value]) => <p key={key}>{key}: {String(value)}</p>)}<p>Storage: {data.occupied.length} / {data.operations?.locations.length || 0} locations used</p><p>Open incidents: {data.records.filter((r) => r.incident).length} on this page</p><p>At shift change: count occupied bins, reconcile cash, and sign the physical handover register.</p></div></details>
        </>}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <form onSubmit={checkin} className={`${card} space-y-4`}><div className="flex items-center gap-3"><Package className="text-cyan-600" /><h2 className="text-xl font-bold">New check-in / Naya deposit</h2></div>
            <p className="text-sm text-slate-500">Registration does not confirm physical custody. Fee: {money(data?.operations?.feePaise || 0)}. {data?.operations?.pricingTerms}</p>
            <label className={label}>Visitor name / Naam<Input required value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} /></label>
            <label className={label}>Visitor phone / Mobile<Input required type="tel" autoComplete="tel" value={form.visitorPhone} onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })} /></label>
            <label className={label}>Guardian phone (optional)<Input type="tel" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} /></label>
            <div className="rounded-2xl bg-[#075E54] p-4 text-sm text-white"><p className="font-bold">Parents ko yeh message jaayega:</p><p className="mt-3">Namaste! Aapke ward {form.visitorName || "[NAME]"} ka saman physical acceptance ke baad {data?.venue.name || "[VENUE]"} par jama hoga.</p><p className="mt-2">Items: {items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}<br />Token: Will be generated</p><p className="mt-2 text-right">✓✓ Preview only</p></div>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.visitorConsent} onChange={(e) => setForm({ ...form, visitorConsent: e.target.checked })} />Visitor opted in to transactional WhatsApp updates; STOP opts out.</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.guardianConsent} onChange={(e) => setForm({ ...form, guardianConsent: e.target.checked })} />Guardian has explicitly opted in. Contact is optional.</label>
            <fieldset className="space-y-3"><legend className="mb-2 font-bold">Inspect items and visible condition</legend>{items.map((item, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_5rem]">
              <label className={label}>Item {index + 1}<Input required value={item.name} onChange={(e) => setItems(items.map((v, i) => i === index ? { ...v, name: e.target.value } : v))} /></label>
              <label className={label}>Quantity<Input type="number" min={1} max={20} value={item.quantity} onChange={(e) => setItems(items.map((v, i) => i === index ? { ...v, quantity: Number(e.target.value) } : v))} /></label>
              <label className={`${label} sm:col-span-2`}>Visible condition / Damage<Input required value={item.condition} onChange={(e) => setItems(items.map((v, i) => i === index ? { ...v, condition: e.target.value } : v))} /></label>
              <label className={`${label} sm:col-span-2`}>Notes<Input value={item.notes} onChange={(e) => setItems(items.map((v, i) => i === index ? { ...v, notes: e.target.value } : v))} /></label>
              {items.length > 1 && <button type="button" className="text-left text-sm text-red-700" onClick={() => setItems(items.filter((_, i) => i !== index))}>Remove item</button>}
            </div>)}</fieldset>
            <Button type="button" variant="outline" onClick={() => setItems([...items, newItem()])}>Add item</Button>
            <Button type="submit" className="w-full" disabled={busy || !online || !requestKey || !data?.operations?.locations.length}>{busy ? "Saving..." : "Register / Details save karein"}</Button>
            {selected && <button type="button" className="text-sm text-blue-800 underline" onClick={() => { if (!window.confirm("Start a different visitor? Retry the same request after a network error instead.")) return; setRequestKey(crypto.randomUUID()); setForm({ visitorName: "", visitorPhone: "", guardianPhone: "", visitorConsent: false, guardianConsent: false }); setItems([newItem()]); setSelected(null); setReceipt(null); }}>Start another visitor</button>}
          </form>

          <section className={`${card} space-y-4`}><h2 className="text-xl font-bold">Storage and verified return</h2>
            <Button variant="outline" onClick={() => setScanning(!scanning)}>{scanning ? "Close camera" : "Scan collection coupon"}</Button>
            {scanning && <div className="max-w-sm"><Scanner onScan={(codes) => codes[0]?.rawValue && scan(codes[0].rawValue)} onError={() => { setError("Camera unavailable. Enter the collection code manually."); setScanning(false); }} /></div>}
            {!selected ? <p className="text-sm text-slate-500">Register a visitor or select a record below. Name/phone search never authorizes release.</p> : <>
              <div className="rounded-xl bg-slate-50 p-4"><p className="font-mono font-bold text-blue-900">{selected.receiptNumber}</p><h3 className="mt-2 text-lg font-bold">{selected.visitorName}</h3><p className="text-sm text-slate-600">{selected.visitorPhone} · {selected.state}</p><p className="mt-2 font-bold">Location: {selected.location || "Not accepted yet"}</p><p className="mt-1 text-sm">Fee: {money(selected.amountPaise)} · {selected.paymentState}</p></div>
              <ul className="space-y-2 text-sm">{selected.items.map((item, index) => <li key={index}>{item.quantity} × {item.name} · {item.condition}{item.notes && ` · ${item.notes}`}</li>)}</ul>
              {selected.photoPath && <Image unoptimized width={640} height={480} src={selected.photoPath} alt="Private operator photo of deposited items" className="max-h-64 w-full rounded-xl object-contain" />}
              {selected.state === "REGISTERED" && <>
                <label className={label}><span className="flex items-center gap-2"><Camera className="size-4" />Capture item photo (required)</span><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => upload(e.target.files?.[0])} /></label>
                {photoAsset && <p className="text-sm text-emerald-700">Private photo saved</p>}
                <label className={label}>Physical rack / bin<select value={location} onChange={(e) => setLocation(e.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"><option value="">Choose free location</option>{data?.operations?.locations.filter((v) => !data.occupied.includes(v)).map((v) => <option key={v}>{v}</option>)}</select></label>
                <label className="flex gap-2 text-sm"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />I inspected the actual items, recorded their condition and physically placed them in the selected location.</label>
                <Button className="w-full" disabled={busy || !verified || !photoAsset || !location} onClick={() => run(() => action({ action: "store", photoAsset, location, physicalAcceptance: true, itemsVerified: true }))}>Confirm Stored / Saman jama hua</Button>
              </>}
              {selected.state === "STORED" && <>
                {selected.paymentState === "pending" && <Button variant="outline" disabled={busy} onClick={() => { if (window.confirm(`Confirm ${money(selected.amountPaise)} cash physically received?`)) run(() => action({ action: "payment", state: "paid", method: "cash", reference: selected.receiptNumber, reason: "Cash physically counted at counter" })); }}>Record cash received / Cash mila</Button>}
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Compare photo, quantities and condition. Do not release based on a name or phone search alone.</p>
                <label className={label}>Separate collection code / Printed coupon<Input value={collectionCode} autoComplete="off" onChange={(e) => setCollectionCode(e.target.value.trim())} /></label>
                <label className="flex gap-2 text-sm"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />Items match the record and have been physically handed to the coupon holder.</label>
                <Button className="w-full min-h-12" disabled={busy || !verified || !collectionCode} onClick={() => { if (window.confirm(`Have you physically returned all items to ${selected.visitorName}?`)) run(() => action({ action: "return", requestKey: returnKey, collectionCode, physicalHandover: true, itemsVerified: true })); }}>Mark Returned / Saman wapas diya</Button>
              </>}
              {selected.state === "RETURNED" && <p className="rounded-xl bg-emerald-50 p-4 font-bold text-emerald-900">Returned. Collection authorization expired. {date(selected.returnedAt)}</p>}
              {selected.incident && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900">OPEN INCIDENT: {selected.incident}</p>}
              {receipt?.receiptPath && <Link className="inline-block text-sm font-bold text-blue-800 underline" href={receipt.receiptPath} target="_blank">Open masked visitor receipt</Link>}
              {receipt?.collectionCode && selected.state === "STORED" && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="text-sm font-bold">Issue printed collection coupon to visitor</p><label className="mt-3 flex items-center gap-2 text-sm">Printer width<select value={printer} onChange={(e) => setPrinter(e.target.value as "58mm" | "80mm")}><option>58mm</option><option>80mm</option></select></label><Button className="mt-3" onClick={() => window.print()}>Print receipt + collection coupon</Button></div>}
              <details><summary className="cursor-pointer text-sm font-bold">Incident / Cancellation {manager && "/ Manager controls"}</summary><div className="mt-3 grid gap-3"><label className={label}>Audit reason<textarea className="rounded-lg border p-3" value={reason} onChange={(e) => setReason(e.target.value)} /></label><Button variant="outline" disabled={busy || reason.length < 10} onClick={() => run(() => action({ action: "incident", reason }))}>Report incident</Button>{selected.state === "REGISTERED" && <Button variant="outline" disabled={busy || reason.length < 10} onClick={() => run(() => action({ action: "cancel", reason }))}>Cancel registration</Button>}{manager && <><label className={label}>Lost receipt: verification evidence (do not store full ID numbers)<textarea className="rounded-lg border p-3" value={verification} onChange={(e) => setVerification(e.target.value)} /></label><Button variant="outline" disabled={busy || reason.length < 15 || verification.length < 15} onClick={() => run(() => action({ action: "replace", reason, verification }))}>Approve replacement collection coupon</Button><Button variant="outline" disabled={busy || reason.length < 10} onClick={() => run(() => action({ action: "resolve", reason }))}>Resolve incident</Button><Button variant="outline" disabled={busy || reason.length < 10} onClick={() => run(() => action({ action: "payment", state: selected.paymentState === "paid" ? "refunded" : "waived", method: "manual", reference: selected.receiptNumber, reason }))}>Manager waiver / Refund</Button><Button variant="outline" disabled={busy || reason.length < 10} onClick={() => run(async () => { await send("/api/pilot/notifications/retry", { recordId: selected.id, reason }); setNotice("Retry queued. This is not delivery confirmation."); })}>Retry failed notification</Button></>}</div></details>
              <details><summary className="cursor-pointer text-sm font-bold">Audit trail and notification states</summary><ul className="mt-3 space-y-2 text-xs">{selected.events.map((v, i) => <li key={i}>{date(v.at)} · {v.action} · {v.reason}</li>)}{selected.notifications.map((v, i) => <li key={i}>{v.audience} · {v.event}: {v.state} {v.errorCode || ""}</li>)}</ul></details>
            </>}
          </section>
        </div>
        <section className={`${card} space-y-4`}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Deposits and shift handover</h2>{manager && <a className="text-sm font-bold text-blue-900 underline" href="/api/pilot/export">Export CSV (500 rows/page)</a>}</div><div className="flex flex-wrap gap-3"><label className={`${label} min-w-0 flex-1`}>Search by token / Name / Phone / Rack<Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label><label className={label}>Status<select className="min-h-11 rounded-lg border bg-white px-3" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}><option value="">All states</option>{["REGISTERED", "STORED", "RETURNED", "CANCELLED"].map((v) => <option key={v}>{v}</option>)}</select></label></div><div className="grid gap-3 md:grid-cols-2">{data?.records.map((record) => <button key={record.id} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-cyan-600 focus-visible:outline-cyan-600" onClick={() => run(() => selectRecord(record))}><span className="font-mono text-sm font-bold text-blue-900">{record.receiptNumber}</span><span className="mt-2 block font-bold">{record.visitorName}</span><span className="text-sm text-slate-600">{record.state} · {record.location || "Not stored"}</span>{record.state === "STORED" && now - new Date(record.storedAt!).getTime() > 10_800_000 && <span className="mt-2 block text-sm font-bold text-red-700">Overdue &gt;3h / Saman lena baki</span>}</button>)}</div>{data?.records.length === 0 && <p>No matching records / Abhi koi record nahi hai.</p>}<div className="flex items-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><p className="text-sm">Page {page} · {data?.total || 0} records</p><Button variant="outline" disabled={!data || page * 25 >= data.total} onClick={() => setPage(page + 1)}>Next</Button></div></section>
        {manager && <details className={card}><summary className="cursor-pointer text-lg font-bold">Manager: capacity, pricing and staff</summary><div className="mt-5 grid gap-6 lg:grid-cols-2"><form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); run(async () => { await send("/api/pilot/operations", { ...config, locations: config.locations.split("\n").filter(Boolean), acceptedItems: config.acceptedItems.split("\n").filter(Boolean), prohibitedItems: config.prohibitedItems.split("\n").filter(Boolean) }); setNotice("Operations saved"); }); }}><label className={label}>Operating hours<Input value={config.hours} onChange={(e) => setConfig({ ...config, hours: e.target.value })} /></label>{(["locations", "acceptedItems", "prohibitedItems"] as const).map((key) => <label key={key} className={label}>{key} (one per line)<textarea className="min-h-20 rounded-lg border p-3" value={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.value })} /></label>)}<label className={label}>Fee per deposit, paise (100 paise = ₹1)<Input type="number" min={0} max={100000} value={config.feePaise} onChange={(e) => setConfig({ ...config, feePaise: Number(e.target.value) })} /></label><label className={label}>Visitor pricing terms<Input value={config.pricingTerms} onChange={(e) => setConfig({ ...config, pricingTerms: e.target.value })} /></label><label className={label}>Photo retention days (1-90)<Input type="number" min={1} max={90} value={config.retentionDays} onChange={(e) => setConfig({ ...config, retentionDays: Number(e.target.value) })} /></label><Button disabled={busy}>Save capacity and pricing</Button><Button type="button" variant="outline" onClick={() => { if (data.operations) setConfig({ ...data.operations, locations: data.operations.locations.join("\n"), acceptedItems: data.operations.acceptedItems.join("\n"), prohibitedItems: data.operations.prohibitedItems.join("\n") }); }}>Load saved settings</Button></form><section className="space-y-3"><h3 className="font-bold">Staff invitations</h3><label className={label}>Staff name<Input value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /></label><label className={label}>Staff phone<Input type="tel" value={invite.phone} onChange={(e) => setInvite({ ...invite, phone: e.target.value })} /></label><label className={label}>Role<select className="min-h-11 rounded-lg border p-2" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}><option value="operator">Operator</option><option value="admin">Venue manager</option></select></label><Button disabled={busy} onClick={() => run(async () => { const value = await send<{ inviteToken: string }>("/api/pilot/staff", { action: "invite", ...invite }); setInviteToken(value.inviteToken); })}>Create invitation (48h)</Button>{inviteToken && <p className="break-all rounded-lg bg-slate-50 p-3 text-sm">Share securely with this staff member. Login with OTP and invitation token: {inviteToken}</p>}{data.staff.map((member) => <div key={member._id} className="rounded-xl border p-3 text-sm"><p className="font-bold">{member.name} · {member.role} · {member.isActive ? "Active" : "Revoked"}</p><p>{member.phone}</p>{member._id !== data.actor.operatorId && <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => run(async () => { await send("/api/pilot/staff", { action: "revoke", operatorId: member._id }); })}>Revoke</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => run(async () => { await send("/api/pilot/staff", { action: "role", operatorId: member._id, role: member.role === "admin" ? "operator" : "admin" }); })}>Change role</Button></div>}</div>)}<p className="text-sm text-slate-600">Venue fee collections: {money(data.stats.reduce((total, row) => total + row.collectedPaise, 0))}. This is venue cash, not SafeTag platform revenue.</p></section></div></details>}
      </div>
      {selected && receipt?.collectionCode && selected.state === "STORED" && <div className="pilot-print-only" style={{ width: printer }}><h1>SAFETAG</h1><p>{data?.venue.name} · {data?.venue.city}</p><h2>{selected.receiptNumber}</h2><p>{selected.visitorName} · {selected.visitorPhone}</p><p>Stored: {date(selected.storedAt)}</p><ul>{selected.items.map((item, index) => <li key={index}>{item.quantity} × {item.name} · {item.condition}</li>)}</ul><p>{money(selected.amountPaise)} · {selected.paymentState}</p><p>{selected.pricingTerms}</p><QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}${receipt.receiptPath}`} size={140} /><p>Receipt view / Status dekhein</p><hr /><h2>COLLECTION COUPON</h2><p>Keep this coupon private. Show it at the counter. Is slip ko sambhal kar rakhein.</p><QRCodeSVG value={`STC:${selected.id}:${receipt.collectionCode}`} size={140} /><p className="break-all">{receipt.collectionCode}</p><p>Lost coupon? Manager verification required.</p></div>}
      <style jsx global>{`.pilot-print-only { display: none; } @media print { @page { margin: 2mm; } body { background: white !important; color: black !important; } body > * { visibility: hidden; } .pilot-no-print { display: none !important; } .pilot-print-only, .pilot-print-only * { visibility: visible; } .pilot-print-only { display: block; position: absolute; top: 0; left: 0; padding: 2mm; max-width: 100%; font: 11px/1.5 monospace; overflow-wrap: anywhere; } .pilot-print-only svg { max-width: 100%; height: auto; display: block; margin: 8px auto; } } @media (prefers-reduced-motion: reduce) { * { animation: none !important; scroll-behavior: auto !important; } }`}</style>
    </main>
  </div>;
}

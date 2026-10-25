"use client";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { publicReceipt } from "@/lib/pilot/custody";
import { readApiJson } from "@/lib/api";
type Receipt = Awaited<ReturnType<typeof publicReceipt>>;
export function PublicPilotReceipt() {
  const [receipt, setReceipt] = useState<Receipt | null>(null), [error, setError] = useState("");
  const [share, setShare] = useState("");
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return; loaded.current = true;
    const access = window.location.hash.slice(1);
    const shareUrl = access ? `${window.location.origin}/pilot/receipt#${access}` : "";
    if (access) window.history.replaceState(null, "", "/pilot/receipt");
    fetch("/api/pilot/receipt", access ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access }) } : { cache: "no-store" })
      .then((r) => readApiJson<Receipt>(r, "Receipt unavailable. Ask the venue manager."))
      .then((value) => { setReceipt(value); setShare(shareUrl); }).catch((e) => setError(e.message));
  }, []);
  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900"><article className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold tracking-widest text-cyan-700">SAFETAG · VISITOR RECEIPT</p>{error ? <p role="alert" className="mt-5 text-red-800">{error}</p> : !receipt ? <p role="status">Loading receipt...</p> : <><h1 className="mt-3 text-2xl font-bold">{receipt.venueName}</h1><p>{receipt.city}</p>{share && <div className="my-6 flex justify-center"><QRCodeSVG value={share} size={200} /></div>}<p className="break-all font-mono text-xl font-bold">{receipt.receiptNumber}</p><p className="mt-3 rounded-lg bg-cyan-50 p-3 font-bold">{receipt.state === "REGISTERED" ? "Registered only / Physical custody not accepted" : receipt.state === "STORED" ? "In custody / Saman jama hai" : receipt.state === "RETURNED" ? "Returned / Saman wapas mila" : "Cancelled"}</p><p className="mt-4">{receipt.visitorName} · {receipt.visitorPhone}</p><ul className="my-5 space-y-2">{receipt.items.map((item, i) => <li key={i}>{item.quantity} × {item.name}</li>)}</ul><p className="font-bold">Fee: ₹{(receipt.amountPaise / 100).toFixed(2)} · {receipt.paymentState}</p><p className="mt-2 text-sm text-slate-600">{receipt.pricingTerms}</p><p className="mt-5 text-sm">This QR shows status only. Bring the separate collection coupon to collect items. Phone stored? Use the printed coupon. Lost slip? Contact the venue manager.</p><div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm"><h2 className="font-bold">Notifications</h2>{receipt.notifications.length ? receipt.notifications.map((job, i) => <p key={i}>{job.audience}: {job.state}</p>) : <p>No notification requested. Consent is optional.</p>}<p className="mt-2 text-slate-500">Queued or sent does not mean delivered.</p></div><button className="mt-5 rounded-lg bg-blue-900 px-4 py-2 text-white" onClick={() => window.print()}>Print status receipt</button></>}<a className="mt-5 block text-sm text-blue-800 underline" href="/privacy">Privacy and support</a></article></main>;
}

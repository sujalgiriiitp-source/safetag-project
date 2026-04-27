import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About SafeTag — Making India’s public spaces safer",
  description:
    "SafeTag was born at HackDiwas 3.0 to solve secure belongings management for exam centers, temples, parks and public venues.",
  alternates: {
    canonical: "/about"
  }
};

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SafeTag",
    url: "https://safetag.vercel.app",
    email: "safetag.in@gmail.com",
    founder: {
      "@type": "Person",
      name: "Sujal Giri"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <main>
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Our Mission</p>
            <h1 className="mx-auto mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-6xl">
              Making India's public spaces safer, one QR code at a time.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-500">
              SafeTag gives every venue a proof-based, hardware-free belongings counter that works with the staff and storage space they already have.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[0.45fr_0.55fr]">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
            <Sparkles className="size-10 text-emerald-400" />
            <h2 className="mt-5 text-3xl font-black">Our Story</h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              SafeTag was born at HackDiwas 3.0 at United University, Prayagraj in April 2026.
              We saw students leaving phones with roadside shopkeepers outside exam centers — no receipt,
              no proof, no accountability. We built the solution in 36 hours. Now we're making it real.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["10 lakh+", "Venues where belongings are restricted"],
              ["86 lakh+", "Exam students need safer counters every year"],
              ["₹0", "Hardware needed to start with SafeTag"],
              ["30 sec", "Average QR check-in workflow"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-3xl font-black text-blue-600">{value}</p>
                <p className="mt-2 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">How we solve it</p>
              <h2 className="mt-3 text-4xl font-black text-slate-900">Software trust for physical counters</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                [QrCode, "QR receipt", "Visitors get a printed and digital token for verified return."],
                [ShieldCheck, "Photo proof", "Operators capture item photos so every handover has evidence."],
                [MessageCircle, "WhatsApp alerts", "Parents and visitors receive check-in and return notifications."]
              ].map(([Icon, title, copy]) => {
                const FeatureIcon = Icon as typeof QrCode;
                return (
                  <div key={title as string} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FeatureIcon className="size-6" />
                    </div>
                    <h3 className="mt-5 font-black text-slate-900">{title as string}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{copy as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[0.38fr_0.62fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white">
              SG
            </div>
            <h2 className="mt-6 text-3xl font-black text-slate-900">Sujal Giri</h2>
            <p className="mt-2 font-semibold text-blue-600">Founder & Developer</p>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Shambhunath Institute of Engineering & Technology. Built SafeTag at HackDiwas 3.0.
            </p>
          </div>

          <div id="contact" className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Contact</p>
            <h2 className="mt-3 text-4xl font-black">Let’s make your venue safer</h2>
            <div className="mt-8 grid gap-4">
              <a href="mailto:safetag.in@gmail.com" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-100">
                <Mail className="size-5 text-emerald-400" />
                safetag.in@gmail.com
              </a>
              <a href="https://wa.me/916306601592" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-100">
                <MessageCircle className="size-5 text-emerald-400" />
                Chat on WhatsApp
              </a>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700">
                  <Link href="/register">Register venue</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/nearby">Find operators</Link>
                </Button>
              </div>
              <p className="text-sm text-slate-400">LinkedIn and Twitter links will be connected before public launch.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

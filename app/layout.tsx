import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://safetag.vercel.app"),
  title: "SafeTag — Secure Belongings | Temples, Exam Centers, Parks",
  description:
    "India's first QR-based secure deposit system. Zero hardware, instant QR receipts, WhatsApp alerts. For temples, exam centers, national parks and museums.",
  keywords:
    "secure locker india, exam center storage, temple deposit counter, QR receipt, belongings management, JEE NEET storage",
  applicationName: "SafeTag",
  robots: "index, follow",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "SafeTag — Apna Saman Surakshit Rakho",
    description: "Hardware-free secure deposit system for India's venues",
    url: "https://safetag.vercel.app",
    siteName: "SafeTag",
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SafeTag — Secure Belongings Platform",
    description: "India's first QR-based secure deposit system"
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/safetag-icon.svg",
    apple: "/icons/safetag-icon.svg",
    shortcut: "/icons/safetag-icon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1E3A8A" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" }
  ],
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <Providers>
          <ServiceWorkerRegister />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

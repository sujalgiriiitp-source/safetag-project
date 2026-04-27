import type { Metadata } from "next";
import { StartupLandingPage } from "@/components/landing/startup-landing-page";

export const metadata: Metadata = {
  title: "SafeTag — Secure Belongings | Temples, Exam Centers, Parks",
  description:
    "India's first QR-based secure deposit system. Zero hardware, instant QR receipts, WhatsApp alerts.",
  alternates: {
    canonical: "/"
  }
};

export default function LandingPage() {
  return <StartupLandingPage />;
}

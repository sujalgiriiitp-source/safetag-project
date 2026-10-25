import type { Metadata } from "next";
import { StartupLandingPage } from "@/components/landing/startup-landing-page";

export const metadata: Metadata = {
  title: "SafeTag — Secure Belongings | Temples, Exam Centers, Parks",
  description:
    "QR receipts, private item evidence and verified handovers for staffed belongings counters.",
  alternates: {
    canonical: "/"
  }
};

export default function LandingPage() {
  return <StartupLandingPage />;
}

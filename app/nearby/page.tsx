import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { NearbyOperatorsExplorer } from "@/components/nearby/nearby-operators-explorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find SafeTag Operators Near You",
  description: "Locate QR-based secure deposit counters near exam centers, temples, parks, museums and public venues.",
  alternates: {
    canonical: "/nearby"
  }
};

export default function NearbyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <NearbyOperatorsExplorer />
      </main>
      <Footer />
    </div>
  );
}

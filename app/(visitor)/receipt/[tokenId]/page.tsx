import { notFound } from "next/navigation";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { ReceiptCard } from "@/components/visitor/receipt-card";
import { getDepositByTokenId, getVenueById } from "@/lib/repository";
import { isDemoMode } from "@/lib/demo-mode";
import { getCurrentSession } from "@/lib/session";
export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const session = await getCurrentSession();
  if (!session) notFound();
  const deposit = await getDepositByTokenId((await params).tokenId);
  if (!deposit || deposit.venueId !== session.venueId) notFound();

  const venue = await getVenueById(deposit.venueId);
  if (!venue) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-10">
        <ReceiptCard deposit={deposit} venue={venue} demoMode={isDemoMode()} />
      </main>
      <Footer />
    </div>
  );
}

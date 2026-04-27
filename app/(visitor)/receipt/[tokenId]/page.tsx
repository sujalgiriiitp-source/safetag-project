import { notFound } from "next/navigation";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { ReceiptCard } from "@/components/visitor/receipt-card";
import { getDepositByTokenId, getVenueById } from "@/lib/repository";

export default async function ReceiptPage({ params }: { params: { tokenId: string } }) {
  const deposit = await getDepositByTokenId(params.tokenId);
  if (!deposit) notFound();

  const venue = await getVenueById(deposit.venueId);
  if (!venue) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-10">
        <ReceiptCard deposit={deposit} venue={venue} />
      </main>
      <Footer />
    </div>
  );
}

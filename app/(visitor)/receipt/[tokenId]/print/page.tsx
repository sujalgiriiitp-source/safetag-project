import { notFound } from "next/navigation";
import { ThermalReceipt } from "@/components/print/thermal-receipt";
import { getDepositByTokenId, getVenueById } from "@/lib/repository";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReceiptPrintPageProps = {
  params: Promise<{
    tokenId?: string;
  }>;
};

export default async function ReceiptPrintPage({ params }: ReceiptPrintPageProps) {
  const session = await getCurrentSession();
  if (!session) notFound();
  const tokenId = (await params).tokenId?.trim();
  if (!tokenId) notFound();

  const deposit = await getDepositByTokenId(tokenId);
  if (!deposit || deposit.venueId !== session.venueId) notFound();

  const venue = await getVenueById(deposit.venueId);
  if (!venue) notFound();

  return (
    <main className="min-h-screen bg-white text-black">
      <ThermalReceipt deposit={deposit} venue={venue} />
    </main>
  );
}

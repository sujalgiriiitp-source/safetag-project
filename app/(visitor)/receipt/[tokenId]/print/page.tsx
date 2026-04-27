import { notFound } from "next/navigation";
import { ThermalReceipt } from "@/components/print/thermal-receipt";
import { getDepositByTokenId, getVenueById } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReceiptPrintPageProps = {
  params: {
    tokenId?: string;
  };
};

export default async function ReceiptPrintPage({ params }: ReceiptPrintPageProps) {
  const tokenId = params?.tokenId?.trim();
  if (!tokenId) notFound();

  const deposit = await getDepositByTokenId(tokenId);
  if (!deposit) notFound();

  const venue = await getVenueById(deposit.venueId);
  if (!venue) notFound();

  return (
    <main className="min-h-screen bg-white text-black">
      <ThermalReceipt deposit={deposit} venue={venue} />
    </main>
  );
}

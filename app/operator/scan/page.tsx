import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { QRScanner } from "@/components/operator/qr-scanner";
import { getCurrentSession } from "@/lib/session";

export default async function OperatorScanPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  return (
    <DashboardShell
      title="Scan and custody actions"
      description="Scan live QR receipts, capture storage proof, and return belongings after visual verification."
      activeHref="/dashboard/scan"
    >
      <QRScanner />
    </DashboardShell>
  );
}

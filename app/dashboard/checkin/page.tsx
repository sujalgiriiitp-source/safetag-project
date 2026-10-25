import { redirect } from "next/navigation";
import { OperatorCheckinForm } from "@/components/checkin/operator-checkin-form";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { getVenueById } from "@/lib/repository";
import { getCurrentSession } from "@/lib/session";
import { isDemoMode } from "@/lib/demo-mode";
import { PilotWorkspace } from "@/components/pilot/workspace";

export default async function DashboardCheckinPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!isDemoMode()) return <PilotWorkspace />;

  const venue = await getVenueById(session.venueId);
  if (!venue) redirect("/dashboard");

  return (
    <DashboardShell
      title="Counter check-in workspace"
      description="Register walk-in visitors, detect items, print receipts, and move smoothly into storage proof capture."
      activeHref="/dashboard/checkin"
    >
      <OperatorCheckinForm venue={venue} operatorPhone={session.phone} demoMode={isDemoMode()} />
    </DashboardShell>
  );
}

import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { VenueSettingsForm } from "@/components/settings/venue-settings-form";
import { getCurrentSession } from "@/lib/session";
import { getVenueById } from "@/lib/repository";

export default async function AdminSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const venue = await getVenueById(session.venueId);
  if (!venue) redirect("/dashboard");

  return (
    <DashboardShell
      title="Admin settings"
      description="Venue branding, item categories, operating hours, and visitor instructions can be managed here."
      activeHref="/dashboard/settings"
    >
      <VenueSettingsForm venue={venue} />
    </DashboardShell>
  );
}

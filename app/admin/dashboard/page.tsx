import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/session";
import { getDashboardStats, getDeposits, getOperatorsByVenue, getVenueById } from "@/lib/repository";

export default async function AdminDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const [venue, operators, stats, deposits] = await Promise.all([
    getVenueById(session.venueId),
    getOperatorsByVenue(session.venueId),
    getDashboardStats(session.venueId),
    getDeposits({ venueId: session.venueId })
  ]);

  return (
    <DashboardShell
      title="Venue admin dashboard"
      description="Review venue profile, operator roster, monthly throughput, and custody actions from one place."
      activeHref="/dashboard/settings"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Items in custody" value={stats.itemsInCustody} />
        <StatCard label="Returned today" value={stats.returnedToday} />
        <StatCard label="Operators active" value={operators.filter((operator) => operator.isActive).length} />
        <StatCard label="Today's deposits" value={stats.totalToday} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.46fr_0.54fr]">
        <Card>
          <CardHeader>
            <CardTitle>Venue profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="font-medium">Name:</span> {venue?.name}</p>
            <p><span className="font-medium">Address:</span> {venue?.address}, {venue?.city}</p>
            <p><span className="font-medium">Type:</span> {venue?.type}</p>
            <p><span className="font-medium">Operating hours:</span> {venue?.operatingHours}</p>
            <p><span className="font-medium">Instructions:</span> {venue?.customInstructions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operator accounts and activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {operators.map((operator) => (
              <div key={operator._id} className="rounded-2xl border p-4">
                <p className="font-medium">{operator.name}</p>
                <p className="text-sm text-muted-foreground">{operator.phone} - {operator.role}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

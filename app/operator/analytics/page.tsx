import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummary, getDeposits } from "@/lib/repository";
import { getCurrentSessionVenue } from "@/lib/server-helpers";
import { formatDurationMinutes } from "@/lib/utils";

export default async function OperatorAnalyticsPage() {
  const sessionVenue = await getCurrentSessionVenue();
  if (!sessionVenue) redirect("/login");

  const { session, venue } = sessionVenue;
  const [analytics, deposits] = await Promise.all([
    getAnalyticsSummary(session.venueId),
    getDeposits({ venueId: session.venueId })
  ]);
  const maxWeekly = Math.max(...analytics.weeklyCheckIns.map((point) => point.value), 1);
  const maxHours = Math.max(...analytics.peakHours.map((point) => point.value), 1);
  const totalItems = analytics.itemBreakdown.reduce((sum, item) => sum + item.value, 0) || 1;
  const projectedRevenue = deposits.length * 5;

  return (
    <DashboardShell
      title={`${venue.name} analytics`}
      description="See weekly throughput, busiest arrival windows, and which item categories dominate custody volume."
      activeHref="/dashboard/analytics"
      actions={
        <Button asChild>
          <Link href={`/api/operator/export?kind=analytics&venueId=${session.venueId}`}>Export report</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Average return time"
          value={formatDurationMinutes(analytics.averageReturnMinutes)}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          label="Total items this month"
          value={analytics.totalItemsThisMonth}
          className="border-l-4 border-l-emerald-500"
        />
        <StatCard
          label="Top staff handled"
          value={analytics.staffPerformance[0]?.handled ?? 0}
          className="border-l-4 border-l-amber-500"
        />
      </div>

      <Card className="rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm">
        <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Revenue tracker
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Projected Revenue: ₹{projectedRevenue}</h2>
          </div>
          <p className="text-sm font-medium text-emerald-800">
            Calculated as {deposits.length} deposits × ₹5.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Weekly bar chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {analytics.weeklyCheckIns.map((point) => (
                <div key={point.label} className="rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex h-36 items-end rounded-xl bg-slate-50 p-3">
                    <div
                      className="w-full rounded-t-md bg-blue-600"
                      style={{ height: `${(point.value / maxWeekly) * 100}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-400">{point.label}</p>
                  <p className="text-xs font-bold text-slate-600">{point.value} check-ins</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Peak hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.peakHours.map((point) => (
              <div key={point.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sm text-slate-600">{point.label}</span>
                  <span className="text-sm font-bold text-slate-800">{point.value}</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-2.5 rounded-full bg-emerald-500"
                    style={{ width: `${(point.value / maxHours) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Items breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.itemBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sm text-slate-600">{item.label}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-3 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full"
                      style={{ width: `${(item.value / totalItems) * 100}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{item.value}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 shadow-sm">
          <CardHeader>
            <CardTitle>Staff suggestion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-amber-800">{analytics.staffSuggestion}</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3">
          <CardHeader>
            <CardTitle>Staff performance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {analytics.staffPerformance.map((member) => (
              <div key={member.phone} className="rounded-xl border border-slate-200 p-4">
                <p className="font-medium text-slate-800">{member.name}</p>
                <p className="text-sm text-slate-500">{member.phone}</p>
                <p className="mt-3 text-sm text-slate-600">{member.handled} check-ins handled</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

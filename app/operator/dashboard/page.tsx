import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, MessageCircle, Package, ScanLine, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import { ItemCard } from "@/components/operator/item-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getDashboardStats, getDeposits, getVenueById } from "@/lib/repository";
import { getCurrentSession } from "@/lib/session";

export default async function OperatorDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const [venue, stats, deposits] = await Promise.all([
    getVenueById(session.venueId),
    getDashboardStats(session.venueId),
    getDeposits({ venueId: session.venueId })
  ]);

  const recent = deposits.slice(0, 3);
  const shareText = encodeURIComponent(
    `I'm using SafeTag for secure deposit management at ${venue?.name ?? "my venue"}. Join us: safetag.vercel.app`
  );

  return (
    <DashboardShell
      title={`${venue?.name ?? "Venue"} dashboard`}
      description="Monitor live custody, pending returns, and recent movement from one mobile-friendly workspace."
      activeHref="/dashboard"
      actions={
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/checkin">New Check-in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/scan">Scan QR</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              Share SafeTag
            </a>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="In custody right now"
          value={stats.itemsInCustody}
          icon={<Package className="size-5" />}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          label="Returned today"
          value={stats.returnedToday}
          icon={<ShieldCheck className="size-5" />}
          className="border-l-4 border-l-emerald-500"
        />
        <StatCard
          label="Overdue over 3 hours"
          value={stats.overdueCount}
          icon={<Clock3 className="size-5" />}
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          label="Total today"
          value={stats.totalToday}
          icon={<ScanLine className="size-5" />}
          className="border-l-4 border-l-slate-400"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.64fr_0.36fr]">
        <div className="grid gap-4">
          {recent.length ? recent.map((deposit) => <ItemCard key={deposit._id} deposit={deposit} venue={venue} />) : <EmptyState title="No recent activity" description="Deposits will show up here as soon as visitors start checking in." />}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Recent activity feed</h2>
          <div className="mt-5 grid gap-4">
            {recent.map((deposit) => (
              <div key={deposit.tokenId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-slate-800">{deposit.visitorName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {deposit.tokenId} - {deposit.itemsList.join(", ")}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-blue-600">
                  {deposit.status.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

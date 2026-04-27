import Link from "next/link";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { BroadcastForm } from "@/components/superadmin/broadcast-form";
import { VenueApprovalList } from "@/components/superadmin/venue-approval-list";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { getDeposits, getPlatformSnapshot, getVenues, getWaitlistEntries } from "@/lib/repository";
import { formatDateTime, formatStatus, resolveDepositStatus } from "@/lib/utils";

function getSuperAdminStatusBadgeClass(statusLabel: string) {
  if (statusLabel === "In Custody") return "bg-blue-100 text-blue-800 px-[10px] py-1 font-semibold";
  if (statusLabel === "Returned") return "bg-green-100 text-green-800 px-[10px] py-1 font-semibold";
  if (statusLabel === "Overdue") return "bg-red-100 text-red-800 px-[10px] py-1 font-semibold";
  return "px-[10px] py-1 font-semibold";
}

function getWhatsAppContactUrl(phone: string, venueName: string) {
  const cleaned = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hi, SafeTag team here. Your venue ${venueName} is ready for the next onboarding step.`
  );
  return `https://wa.me/${cleaned}?text=${message}`;
}

function getWeeklyDepositGrowth(deposits: Awaited<ReturnType<typeof getDeposits>>) {
  const now = new Date();

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const label = date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" });
    const value = deposits.filter((deposit) => {
      const created = new Date(deposit.createdAt);
      return created.toDateString() === date.toDateString();
    }).length;

    return { label, value };
  });
}

export default async function SuperAdminPage() {
  const [snapshot, venues, deposits, waitlistEntries] = await Promise.all([
    getPlatformSnapshot(),
    getVenues(),
    getDeposits(),
    getWaitlistEntries()
  ]);
  const projectedRevenue = deposits.length * 5;
  const growth = getWeeklyDepositGrowth(deposits);
  const maxGrowth = Math.max(...growth.map((point) => point.value), 1);

  return (
    <DashboardShell
      title="Super admin control tower"
      description="Approve venues, inspect platform-wide usage, and export all deposit activity for reporting."
      activeHref="/superadmin"
      actions={
        <Button asChild>
          <Link href="/api/superadmin/export">Export all data as CSV</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total venues" value={snapshot.totalVenues} className="border-l-4 border-l-blue-500" valueClassName="mt-3 text-3xl font-bold text-blue-600" />
        <StatCard label="Approved venues" value={snapshot.approvedVenues} className="border-l-4 border-l-emerald-500" valueClassName="mt-3 text-3xl font-bold text-blue-600" />
        <StatCard label="Live deposits" value={snapshot.liveDeposits} className="border-l-4 border-l-red-500" valueClassName="mt-3 text-3xl font-bold text-blue-600" />
        <StatCard label="Total deposits" value={snapshot.totalDeposits} className="border-l-4 border-l-slate-400" valueClassName="mt-3 text-3xl font-bold text-blue-600" />
        <StatCard label="Cities covered" value={snapshot.citiesCovered} className="border-l-4 border-l-amber-500" valueClassName="mt-3 text-3xl font-bold text-blue-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.34fr_0.66fr]">
        <Card className="rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700">₹{projectedRevenue}</p>
            <p className="mt-2 text-sm text-emerald-800">
              Total deposits × ₹5 projected earnings.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Growth chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {growth.map((point) => (
                <div key={point.label} className="grid gap-2 text-center">
                  <div className="flex h-28 items-end rounded-xl bg-slate-50 p-2">
                    <div
                      className="w-full rounded-t-md bg-blue-600"
                      style={{ height: `${Math.max((point.value / maxGrowth) * 100, 8)}%` }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">{point.label}</p>
                  <p className="text-xs font-bold text-slate-800">{point.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Venue approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <VenueApprovalList venues={venues} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>All deposits searchable table</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Token</TableHeaderCell>
                  <TableHeaderCell>Visitor</TableHeaderCell>
                  <TableHeaderCell>Venue</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {deposits.map((deposit) => {
                  const venue = venues.find((item) => item._id === deposit.venueId);
                  const statusLabel = formatStatus(deposit.status, deposit.checkInTime, deposit.returnTime);
                  const resolved = resolveDepositStatus(deposit.status, deposit.checkInTime, deposit.returnTime);
                  return (
                    <TableRow key={deposit._id} className="odd:bg-[#F8FAFC] even:bg-white">
                      <TableCell className="font-mono text-sm font-medium text-blue-600">{deposit.tokenId}</TableCell>
                      <TableCell>{deposit.visitorName}</TableCell>
                      <TableCell>{venue?.name ?? "Unknown venue"}</TableCell>
                      <TableCell>
                        <Badge className={getSuperAdminStatusBadgeClass(statusLabel)}>
                          {resolved === "in_custody" ? "In Custody" : statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(deposit.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Waitlist management</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>Venue</TableHeaderCell>
                <TableHeaderCell>City</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {waitlistEntries.map((entry) => (
                <TableRow key={entry._id} className="odd:bg-[#F8FAFC] even:bg-white">
                  <TableCell>{entry.email}</TableCell>
                  <TableCell>{entry.phone}</TableCell>
                  <TableCell>{entry.venueName}</TableCell>
                  <TableCell>{entry.city}</TableCell>
                  <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700">
                      <a href={getWhatsAppContactUrl(entry.phone, entry.venueName)} target="_blank" rel="noreferrer">
                        Approve &amp; Contact
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BroadcastForm />
    </DashboardShell>
  );
}

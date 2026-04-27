import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/ui/table";
import { getCurrentSession } from "@/lib/session";
import { getDeposits } from "@/lib/repository";
import { formatDateTime, formatStatus, getStatusClasses } from "@/lib/utils";

export default async function OperatorItemsPage({
  searchParams
}: {
  searchParams: { status?: string; query?: string };
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const deposits = await getDeposits({
    venueId: session.venueId,
    status: searchParams.status as any,
    query: searchParams.query
  });

  return (
    <DashboardShell
      title="Today's deposits"
      description="Token-wise table for in-custody, returned, and overdue items with photo proof and export support."
      activeHref="/dashboard/items"
      actions={
        <Button asChild>
          <Link href={`/api/operator/export?kind=items&venueId=${session.venueId}`}>
            Export as PDF
          </Link>
        </Button>
      }
    >
      <form className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
        <Select name="status" defaultValue={searchParams.status || ""}>
          <option value="">All</option>
          <option value="in_custody">In Custody</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </Select>
        <Input
          name="query"
          defaultValue={searchParams.query || ""}
          placeholder="Search by token, name, or phone"
        />
        <Button type="submit">Apply filters</Button>
      </form>

      <div className="overflow-hidden rounded-[2rem] border bg-card shadow-panel">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Token</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell>Photo</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {deposits.map((deposit) => (
                <TableRow
                  key={deposit._id}
                  className={deposit.status === "overdue" ? "bg-destructive/5" : undefined}
                >
                  <TableCell className="font-medium">{deposit.tokenId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{deposit.visitorName}</p>
                      <p className="text-xs text-muted-foreground">{deposit.visitorPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{deposit.itemsList.join(", ")}</TableCell>
                  <TableCell>
                    {deposit.itemsPhotoUrl ? (
                      <details>
                        <summary className="cursor-pointer text-sm text-primary">View photo</summary>
                        <div className="mt-3 overflow-hidden rounded-2xl border">
                          <Image
                            src={deposit.itemsPhotoUrl}
                            alt={deposit.tokenId}
                            width={480}
                            height={320}
                            className="h-24 w-32 object-cover"
                            unoptimized
                          />
                        </div>
                      </details>
                    ) : (
                      <span className="text-sm text-muted-foreground">Awaiting capture</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(deposit.checkInTime)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusClasses(deposit.status, deposit.checkInTime, deposit.returnTime)}>
                      {formatStatus(deposit.status, deposit.checkInTime, deposit.returnTime)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardShell>
  );
}

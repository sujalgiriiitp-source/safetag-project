import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { ItemCard } from "@/components/operator/item-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getCurrentSession } from "@/lib/session";
import { getVenueById, searchDeposits } from "@/lib/repository";

export default async function OperatorSearchPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const query = searchParams.q || "";
  const [venue, results] = await Promise.all([
    getVenueById(session.venueId),
    query ? searchDeposits(query, session.venueId) : Promise.resolve([])
  ]);

  return (
    <DashboardShell
      title="Manual search fallback"
      description="When the visitor phone is dead or QR scan fails, operators can search by token ID, phone number, or visitor name."
      activeHref="/dashboard/search"
    >
      <form className="flex flex-col gap-3 sm:flex-row">
        <Input name="q" defaultValue={query} placeholder="Search by token, phone, or name" />
        <Button type="submit">Search</Button>
      </form>

      <div className="grid gap-4">
        {query && !results.length ? (
          <EmptyState title="No matching deposits" description="Try token ID, exact phone number, or visitor name spelling." />
        ) : null}
        {results.map((deposit) => (
          <ItemCard key={deposit._id} deposit={deposit} venue={venue} />
        ))}
      </div>
    </DashboardShell>
  );
}

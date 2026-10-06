import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { VenueSettingsForm } from "@/components/settings/venue-settings-form";
import { getCurrentSession } from "@/lib/session";
import { getVenueById } from "@/lib/repository";

const SUBSCRIPTION_UPI_ID = process.env.SUBSCRIPTION_UPI_ID?.trim() || "";

function formatExpiry(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN");
}

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
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">Subscription & billing</h2>
        <p className="mt-1 text-sm text-slate-500">
          Status:{" "}
          <span className="font-medium text-slate-700">{venue.subscriptionStatus ?? "none"}</span>
          {formatExpiry(venue.subscriptionExpiresAt) ? (
            <> · expires {formatExpiry(venue.subscriptionExpiresAt)}</>
          ) : null}
        </p>
        {SUBSCRIPTION_UPI_ID ? (
          <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Pay your subscription via any UPI app to{" "}
              <span className="font-mono font-semibold text-slate-800">{SUBSCRIPTION_UPI_ID}</span>,
              then share the payment screenshot on WhatsApp with the SafeTag team.
            </p>
            <p className="mt-1">
              Your subscription is activated manually after we receive the payment.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            To activate a subscription, contact the SafeTag team — they will share payment details.
          </p>
        )}
      </div>
      <VenueSettingsForm venue={venue} />
    </DashboardShell>
  );
}

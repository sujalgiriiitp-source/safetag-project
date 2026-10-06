import { Venue } from "@/types";

function formatExpiry(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN");
}

/**
 * Pilot-friendly subscription banner. Deliberately does NOT hard-block the
 * operator panel on expiry.
 *
 * TODO(subscription): add a hard gate here (or in middleware) once paid
 * subscriptions are the norm — e.g. redirect expired venues to a billing page.
 */
export function SubscriptionBanner({ venue }: { venue: Venue | null }) {
  const status = venue?.subscriptionStatus ?? "none";
  if (status === "active") return null;

  const expiry = formatExpiry(venue?.subscriptionExpiresAt);

  const styles: Record<string, string> = {
    none: "border-amber-200 bg-amber-50 text-amber-800",
    trial: "border-blue-200 bg-blue-50 text-blue-800",
    expired: "border-red-200 bg-red-50 text-red-800"
  };

  const copy: Record<string, string> = {
    none: "No active subscription — contact the SafeTag team to activate your venue.",
    trial: `Trial subscription${expiry ? ` — expires ${expiry}` : ""}. Contact the SafeTag team to go live.`,
    expired: "Subscription expired — contact the SafeTag team to renew and keep uninterrupted service."
  };

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${styles[status]}`}>
      {copy[status]}
    </div>
  );
}

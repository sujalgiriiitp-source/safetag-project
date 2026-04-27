import { getCurrentSession } from "@/lib/session";
import { getVenueById } from "@/lib/repository";

export async function getCurrentSessionVenue() {
  const session = await getCurrentSession();
  if (!session) return null;
  const venue = await getVenueById(session.venueId);
  if (!venue) return null;
  return { session, venue };
}

import { VenueType } from "@/types";
import { VENUE_TYPE_META } from "@/lib/constants";

export function buildTokenId(venueType: VenueType, sequence: number) {
  const shortCode = VENUE_TYPE_META[venueType].shortCode;
  // Random suffix makes token IDs non-enumerable: sequential IDs let anyone
  // scrape the whole deposit database via the public receipt lookup.
  // Uses Web Crypto so this module stays safe to import in client components.
  const bytes = new Uint8Array(3);
  globalThis.crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `ST-${shortCode}-${String(sequence).padStart(5, "0")}-${suffix}`;
}

export function buildShortCode(tokenId: string) {
  return tokenId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-10);
}

export function buildShortUrl(shortCode: string) {
  return `/r/${shortCode}`;
}

export function extractTokenId(input: string) {
  // Matches both legacy sequential IDs (ST-EXAM-00001) and the newer
  // non-enumerable form with a random suffix (ST-EXAM-00001-A3F9K2).
  const match = input.match(/ST-[A-Z]+-\d{5}(?:-[A-Z0-9]{4,6})?/i);
  return match ? match[0].toUpperCase() : input.trim().toUpperCase();
}

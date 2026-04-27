import { VenueType } from "@/types";
import { VENUE_TYPE_META } from "@/lib/constants";

export function buildTokenId(venueType: VenueType, sequence: number) {
  const shortCode = VENUE_TYPE_META[venueType].shortCode;
  return `ST-${shortCode}-${String(sequence).padStart(5, "0")}`;
}

export function buildShortCode(tokenId: string) {
  return tokenId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-10);
}

export function buildShortUrl(shortCode: string) {
  return `/r/${shortCode}`;
}

export function extractTokenId(input: string) {
  const match = input.match(/ST-[A-Z]+-\d{5}/i);
  return match ? match[0].toUpperCase() : input.trim().toUpperCase();
}

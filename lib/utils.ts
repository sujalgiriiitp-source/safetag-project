import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DepositStatus, VenueType } from "@/types";
import { VENUE_TYPE_META } from "@/lib/constants";

const OVERDUE_MS = 3 * 60 * 60 * 1000;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value?: string) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

export function formatTimeAgo(value?: string) {
  if (!value) return "just now";
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (hours >= 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours > 0) return `${hours}h ${Math.max(minutes % 60, 1)}m ago`;
  return `${Math.max(minutes, 1)}m ago`;
}

export function formatDurationMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (!hours) return `${remainingMinutes}m`;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatVenueType(type: VenueType) {
  return VENUE_TYPE_META[type].label;
}

export function resolveDepositStatus(status: DepositStatus, checkInTime?: string, returnTime?: string) {
  if (status === "returned" || status === "collected") return "returned";
  if (returnTime) return "returned";
  if (status === "overdue" || status === "unclaimed") return "overdue";
  if (!checkInTime) return "in_custody";
  return Date.now() - new Date(checkInTime).getTime() > OVERDUE_MS ? "overdue" : "in_custody";
}

export function formatStatus(status: DepositStatus, checkInTime?: string, returnTime?: string) {
  const resolved = resolveDepositStatus(status, checkInTime, returnTime);
  switch (resolved) {
    case "in_custody":
      return "In Custody";
    case "returned":
      return "Returned";
    case "overdue":
      return "Overdue";
    default:
      return status;
  }
}

export function getStatusClasses(status: DepositStatus, checkInTime?: string, returnTime?: string) {
  const resolved = resolveDepositStatus(status, checkInTime, returnTime);
  switch (resolved) {
    case "in_custody":
      return "border-primary/20 bg-primary/10 text-primary";
    case "returned":
      return "border-accent/25 bg-accent/10 text-accent";
    case "overdue":
      return "border-destructive/25 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-muted text-foreground";
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sanitizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export function maskPhone(phone: string) {
  const clean = sanitizePhone(phone);
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 3)}******${clean.slice(-2)}`;
}

export function parseJsonEnv<T>(value?: string): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function normalizeItemLabel(item: string) {
  return item.trim().toLowerCase();
}

export function compareItemLists(declaredItems: string[], detectedItems: string[]) {
  const declared = new Set(declaredItems.map(normalizeItemLabel));
  const detected = new Set(detectedItems.map(normalizeItemLabel));

  const missing = declaredItems.filter((item) => !detected.has(normalizeItemLabel(item)));
  const unexpected = detectedItems.filter((item) => !declared.has(normalizeItemLabel(item)));

  return {
    missing,
    unexpected,
    mismatch: missing.length > 0 || unexpected.length > 0
  };
}

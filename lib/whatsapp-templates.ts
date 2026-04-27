import { Deposit, Venue } from "@/types";

function formatClock(value?: string) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).format(date);
}

export function buildGuardianAlertMessage({
  visitorName,
  venueName,
  city,
  itemsList,
  tokenId,
  checkInTime,
  appUrl
}: {
  visitorName: string;
  venueName: string;
  city: string;
  itemsList: string[];
  tokenId: string;
  checkInTime?: string;
  appUrl: string;
}) {
  return [
    "🔐 SafeTag Alert - Saman Safely Jama Hua!",
    "",
    `Namaste! Aapke ward ${visitorName} ne apna saman safely jama kar diya hai.`,
    "",
    `📍 Venue: ${venueName}, ${city}`,
    `📦 Items: ${itemsList.join(", ") || "No items selected"}`,
    `🎫 Token: ${tokenId}`,
    `⏰ Time: ${formatClock(checkInTime)}`,
    "",
    "Is token se saman wapas milega:",
    `${appUrl.replace(/\/$/, "")}/receipt/${tokenId}`,
    "",
    "SafeTag - Apna saman surakshit rakho 🙏"
  ].join("\n");
}

export function buildGuardianPreviewMessage({
  visitorName,
  venueName,
  itemsList,
  tokenId,
  checkInTime
}: {
  visitorName: string;
  venueName: string;
  itemsList: string[];
  tokenId: string;
  checkInTime?: string;
}) {
  return [
    "🔐 SafeTag Alert",
    "",
    `Namaste! Aapke ward ${visitorName || "[Name]"} ne`,
    `apna saman ${venueName || "[Venue]"} mein safely`,
    "jama kar diya hai.",
    "",
    `Items: ${itemsList.length ? itemsList.join(", ") : "[items list]"}`,
    `Token: ${tokenId || "ST-EXAM-XXXXX"}`,
    `Time: ${formatClock(checkInTime)}`,
    "",
    "Saman collect karne ke liye",
    "yahi QR use karein."
  ].join("\n");
}

export function buildVisitorCheckinMessage(deposit: Deposit, venue: Venue, appUrl: string) {
  return [
    "✅ SafeTag Receipt",
    `Token: ${deposit.tokenId}`,
    `Venue: ${venue.name}, ${venue.city}`,
    `Items: ${deposit.itemsList.join(", ")}`,
    `Time: ${formatClock(deposit.checkInTime)}`,
    `Collect with QR: ${appUrl.replace(/\/$/, "")}/receipt/${deposit.tokenId}`,
    "Your items are safe 🔐"
  ].join("\n");
}

export function buildGuardianCheckinTemplate(deposit: Deposit, venue: Venue, appUrl: string) {
  return buildGuardianAlertMessage({
    visitorName: deposit.visitorName,
    venueName: venue.name,
    city: venue.city,
    itemsList: deposit.itemsList,
    tokenId: deposit.tokenId,
    checkInTime: deposit.checkInTime,
    appUrl
  });
}

export function buildReminderTemplate(deposit: Deposit, venue: Venue, appUrl: string) {
  return [
    "⏰ Saman collect karna baki hai!",
    `Token: ${deposit.tokenId}`,
    `Venue: ${venue.name}`,
    `QR link: ${appUrl.replace(/\/$/, "")}/receipt/${deposit.tokenId}`,
    "Jaldi collect karein!"
  ].join("\n");
}

export function buildReturnedTemplate(deposit: Deposit, venue: Venue) {
  return [
    "✅ Saman wapas mil gaya!",
    `Token: ${deposit.tokenId}`,
    `Venue: ${venue.name}`,
    `Return time: ${formatClock(deposit.returnTime || deposit.checkInTime)}`,
    "SafeTag use karne ka shukriya 🙏"
  ].join("\n");
}

export function buildGuardianReturnTemplate(deposit: Deposit, venue: Venue) {
  return [
    "✅ Saman successfully return hua!",
    `${deposit.visitorName} ne apna saman`,
    `${venue.name} se collect kar liya.`,
    "SafeTag 🙏"
  ].join("\n");
}

export function getTemplateGallerySamples(deposit: Deposit, venue: Venue, appUrl: string) {
  return [
    { label: "MSG 1: Check-in confirmed", body: buildVisitorCheckinMessage(deposit, venue, appUrl) },
    { label: "MSG 2: Guardian alert", body: buildGuardianCheckinTemplate(deposit, venue, appUrl) },
    { label: "MSG 3: 2hr reminder", body: buildReminderTemplate(deposit, venue, appUrl) },
    { label: "MSG 4: Items returned", body: buildReturnedTemplate(deposit, venue) },
    { label: "MSG 5: Guardian return alert", body: buildGuardianReturnTemplate(deposit, venue) }
  ];
}

export function formatWhatsappClock(value?: string) {
  return formatClock(value);
}

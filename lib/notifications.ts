import { Deposit, Venue } from "@/types";
import { sendWhatsAppAlert } from "@/lib/twilio";

export const SAFETAG_PRIMARY_VISITOR = "+916306601592";
export const SAFETAG_GUARDIAN_NUMBERS = ["+917007355621", "+918092120939"];
export const SAFETAG_NOTIFICATION_NUMBERS = [
  SAFETAG_PRIMARY_VISITOR,
  ...SAFETAG_GUARDIAN_NUMBERS
];

function formatIndiaDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });
}

function getReceiptUrl(tokenId: string) {
  return `https://safetag.vercel.app/receipt/${tokenId}`;
}

export async function sendDepositCreatedMessages(deposit: Deposit, venue: Venue) {
  const items = deposit.itemsList.join(", ");
  const formattedTime = formatIndiaDateTime(deposit.checkInTime);

  const visitorMessage = `✅ *SafeTag Receipt*

Namaste! Aapka saman safely jama ho gaya hai.

🎫 *Token:* ${deposit.tokenId}
📍 *Venue:* ${venue.name}, ${venue.city}
📦 *Items:* ${items}
⏰ *Check-in:* ${formattedTime}

QR code se saman wapas lein:
👉 ${getReceiptUrl(deposit.tokenId)}

_Kisi bhi problem ke liye reply karein._
_SafeTag — Apna saman surakshit rakho_ 🔐`;

  const guardianMessage = `🔔 *SafeTag Guardian Alert*

Namaste! Aapke ward ka saman SafeTag pe 
safely jama kar diya gaya hai.

👤 *Student:* ${deposit.visitorName}
📍 *Venue:* ${venue.name}, ${venue.city}
📦 *Items jama:* ${items}
🎫 *Token:* ${deposit.tokenId}
⏰ *Time:* ${formattedTime}

✅ Saman completely secure hai.
Wapas milne pe aapko phir se message aayega.

_SafeTag — India's Secure Storage Platform_ 🇮🇳`;

  await sendWhatsAppAlert([SAFETAG_PRIMARY_VISITOR], visitorMessage);
  await sendWhatsAppAlert(SAFETAG_GUARDIAN_NUMBERS, guardianMessage);
}

export async function sendDepositReturnedMessages(deposit: Deposit, venue: Venue) {
  const formattedTime = formatIndiaDateTime(deposit.returnTime ?? new Date());

  await sendWhatsAppAlert(
    SAFETAG_NOTIFICATION_NUMBERS,
    `✅ *SafeTag — Saman Wapas Mil Gaya!*

${deposit.visitorName} ne apna saman successfully 
collect kar liya hai.

📍 *Venue:* ${venue.name}, ${venue.city}
📦 *Items returned:* ${deposit.itemsList.join(", ")}
🎫 *Token:* ${deposit.tokenId}
⏰ *Return time:* ${formattedTime}

SafeTag use karne ka shukriya! 🙏

_safetag.vercel.app_`
  );
}

export async function sendOverdueReminderMessage(deposit: Deposit, venue: Venue) {
  const hoursElapsed = Math.max(
    3,
    Math.floor((Date.now() - new Date(deposit.checkInTime).getTime()) / (1000 * 60 * 60))
  );

  await sendWhatsAppAlert(
    SAFETAG_NOTIFICATION_NUMBERS,
    `⏰ *SafeTag Reminder*

${deposit.visitorName} ka saman abhi tak collect 
nahi hua hai.

🎫 Token: ${deposit.tokenId}
📍 Venue: ${venue.name}
⏰ Check-in time: ${formatIndiaDateTime(deposit.checkInTime)}
⌛ Time elapsed: ${hoursElapsed} hours

Jaldi collect karein:
${getReceiptUrl(deposit.tokenId)}

_SafeTag Support_`
  );
}

export async function sendWaitlistConfirmation(phone: string, venueName: string, position: number) {
  await sendWhatsAppAlert(
    [phone],
    `✅ SafeTag Waitlist

${venueName} waitlist mein add ho gaya hai.
Position: #${position}

Hamari team jaldi contact karegi.
SafeTag — Apna saman surakshit rakho.`
  );
}

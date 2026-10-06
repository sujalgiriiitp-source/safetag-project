import { Deposit, Venue } from "@/types";
import { isTwilioConfigured, sendWhatsAppAlert } from "@/lib/twilio";
import { isEmailConfigured, sendEmail } from "@/lib/email";

// Dev-only override: when set, ALL phone notifications go to this number instead of
// the visitor/guardian. Never hardcode real numbers here.
const NOTIFICATIONS_DEBUG_TO = process.env.NOTIFICATIONS_DEBUG_TO?.trim() || "";

function resolveRecipients(deposit: Deposit): {
  visitor: string[];
  guardian: string[];
  visitorEmails: string[];
  guardianEmails: string[];
} {
  const emails = {
    visitorEmails: deposit.visitorEmail ? [deposit.visitorEmail] : [],
    guardianEmails: deposit.guardianEmail ? [deposit.guardianEmail] : []
  };
  if (NOTIFICATIONS_DEBUG_TO) {
    console.warn(
      "[safetag] NOTIFICATIONS_DEBUG_TO is set — routing all phone notifications to the debug number."
    );
    return { visitor: [NOTIFICATIONS_DEBUG_TO], guardian: [NOTIFICATIONS_DEBUG_TO], ...emails };
  }
  return {
    visitor: deposit.visitorPhone ? [deposit.visitorPhone] : [],
    guardian: deposit.guardianPhone ? [deposit.guardianPhone] : [],
    ...emails
  };
}

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
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://safetag.vercel.app";
  return `${base}/receipt/${tokenId}`;
}

/** Strip WhatsApp-style *bold* markup for the plain-text email body. */
function stripWhatsAppMarkup(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapEmailHtml(subject: string, text: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
  <h2 style="color:#1e3a8a;margin-top:0;font-size:20px;">${escapeHtml(subject)}</h2>
  <div style="color:#334155;line-height:1.7;white-space:pre-line;">${escapeHtml(stripWhatsAppMarkup(text))}</div>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;">SafeTag — Apna saman surakshit rakho 🔐</p>
</div>`;
}

interface NotifyInput {
  phones: string[];
  emails: string[];
  message: string;
  emailSubject: string;
}

/**
 * Central notification router. WhatsApp goes out only when Twilio is
 * configured; email goes out only when Gmail is configured and addresses are
 * provided. Never throws — a missing channel is silently skipped.
 */
async function notify(input: NotifyInput): Promise<void> {
  const phones = [...new Set(input.phones.map((p) => p.trim()).filter(Boolean))];
  if (phones.length > 0 && isTwilioConfigured()) {
    await sendWhatsAppAlert(phones, input.message);
  }

  const emails = [...new Set(input.emails.map((e) => e.trim()).filter(Boolean))];
  if (emails.length > 0 && isEmailConfigured()) {
    await sendEmail({
      to: emails,
      subject: input.emailSubject,
      text: stripWhatsAppMarkup(input.message),
      html: wrapEmailHtml(input.emailSubject, input.message)
    });
  }
}

export async function sendDepositCreatedMessages(deposit: Deposit, venue: Venue) {
  const recipients = resolveRecipients(deposit);
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

  await notify({
    phones: recipients.visitor,
    emails: recipients.visitorEmails,
    message: visitorMessage,
    emailSubject: `SafeTag Receipt — Token ${deposit.tokenId}`
  });
  if (recipients.guardian.length > 0 || recipients.guardianEmails.length > 0) {
    await notify({
      phones: recipients.guardian,
      emails: recipients.guardianEmails,
      message: guardianMessage,
      emailSubject: `SafeTag Guardian Alert — ${deposit.visitorName}`
    });
  }

  await sendVenueOperatorAlert(
    venue,
    `New deposit ${deposit.tokenId} at ${venue.name}`,
    `Namaste! Ek naya deposit register hua hai.\n\n🎫 Token: ${deposit.tokenId}\n👤 Visitor: ${deposit.visitorName}\n📦 Items: ${items}\n⏰ Check-in: ${formattedTime}\n\nVenue dashboard: ${getReceiptUrl(deposit.tokenId)}`
  );
}

export async function sendDepositReturnedMessages(deposit: Deposit, venue: Venue) {
  const formattedTime = formatIndiaDateTime(deposit.returnTime ?? new Date());
  const recipients = resolveRecipients(deposit);

  const message = `✅ *SafeTag — Saman Wapas Mil Gaya!*

${deposit.visitorName} ne apna saman successfully 
collect kar liya hai.

📍 *Venue:* ${venue.name}, ${venue.city}
📦 *Items returned:* ${deposit.itemsList.join(", ")}
🎫 *Token:* ${deposit.tokenId}
⏰ *Return time:* ${formattedTime}

SafeTag use karne ka shukriya! 🙏

_safetag.vercel.app_`;

  await notify({
    phones: [...recipients.visitor, ...recipients.guardian],
    emails: [...recipients.visitorEmails, ...recipients.guardianEmails],
    message,
    emailSubject: `SafeTag — Saman wapas mil gaya (Token ${deposit.tokenId})`
  });

  await sendVenueOperatorAlert(
    venue,
    `Deposit returned ${deposit.tokenId} at ${venue.name}`,
    `Saman successfully wapas de diya gaya.\n\n🎫 Token: ${deposit.tokenId}\n👤 Visitor: ${deposit.visitorName}\n⏰ Return time: ${formattedTime}`
  );
}

export async function sendOverdueReminderMessage(deposit: Deposit, venue: Venue) {
  const hoursElapsed = Math.max(
    3,
    Math.floor((Date.now() - new Date(deposit.checkInTime).getTime()) / (1000 * 60 * 60))
  );
  const recipients = resolveRecipients(deposit);

  await notify({
    phones: [...recipients.visitor, ...recipients.guardian],
    emails: [...recipients.visitorEmails, ...recipients.guardianEmails],
    message: `⏰ *SafeTag Reminder*

${deposit.visitorName} ka saman abhi tak collect 
nahi hua hai.

🎫 Token: ${deposit.tokenId}
📍 Venue: ${venue.name}
⏰ Check-in time: ${formatIndiaDateTime(deposit.checkInTime)}
⌛ Time elapsed: ${hoursElapsed} hours

Jaldi collect karein:
${getReceiptUrl(deposit.tokenId)}

_SafeTag Support_`,
    emailSubject: `SafeTag Reminder — Token ${deposit.tokenId} abhi tak collect nahi hua`
  });
}

export async function sendWaitlistConfirmation(phone: string, venueName: string, position: number) {
  await notify({
    phones: [phone],
    emails: [],
    message: `✅ SafeTag Waitlist

${venueName} waitlist mein add ho gaya hai.
Position: #${position}

Hamari team jaldi contact karegi.
SafeTag — Apna saman surakshit rakho.`,
    emailSubject: `SafeTag Waitlist — ${venueName} (#${position})`
  });
}

/**
 * Operator-side alert, emailed to the venue's contact address.
 * No-op when the venue has no contactEmail or email is unconfigured.
 */
export async function sendVenueOperatorAlert(
  venue: Venue,
  subject: string,
  text: string
): Promise<void> {
  const email = venue.contactEmail?.trim();
  if (!email) return;
  await notify({ phones: [], emails: [email], message: text, emailSubject: subject });
}

import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER?.trim() || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.trim() || "";

export function isEmailConfigured(): boolean {
  return Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
    });
  }
  return cachedTransporter;
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

/**
 * Free notification channel via Gmail SMTP. Never throws: when unconfigured
 * (or on send failure) it logs and no-ops so missing email never breaks a flow.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      "[safetag] Email not configured — set GMAIL_USER and GMAIL_APP_PASSWORD to enable email notifications."
    );
    return false;
  }

  const recipients = (Array.isArray(payload.to) ? payload.to : [payload.to])
    .map((address) => address.trim())
    .filter(Boolean);
  if (recipients.length === 0) return false;

  try {
    await transporter.sendMail({
      from: `"SafeTag" <${GMAIL_USER}>`,
      to: recipients.join(", "),
      subject: payload.subject,
      text: payload.text,
      html: payload.html
    });
    return true;
  } catch (error) {
    console.error("[safetag] Email send failed:", error);
    return false;
  }
}

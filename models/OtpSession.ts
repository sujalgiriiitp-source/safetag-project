import { Schema, model, models } from "mongoose";

const OtpSessionSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    purpose: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const OtpSessionModel = models.OtpSession || model("OtpSession", OtpSessionSchema);

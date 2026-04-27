import { Schema, model, models } from "mongoose";

const WaitlistSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    venueName: { type: String, required: true, trim: true },
    venueType: {
      type: String,
      enum: ["exam", "temple", "park", "museum", "religious", "amusement", "govt", "event"],
      default: "exam"
    },
    city: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "contacted", "approved"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export const WaitlistModel = models.Waitlist || model("Waitlist", WaitlistSchema);

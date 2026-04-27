import { Schema, model, models } from "mongoose";

const VenueSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["exam", "temple", "park", "museum", "religious", "amusement", "govt", "event"],
      required: true
    },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactEmail: String,
    operatingHours: { type: String, default: "08:00 AM - 08:00 PM" },
    logoUrl: { type: String, default: "/icons/safetag-icon.svg" },
    customItemCategories: [String],
    customInstructions: String,
    thermalPrinterSize: {
      type: String,
      enum: ["58mm", "80mm"],
      default: "58mm"
    },
    isApproved: { type: Boolean, default: false },
    operatorPhones: [String],
    averageRating: { type: Number, default: 0 },
    brandColor: String
  },
  { timestamps: true }
);

export const VenueModel = models.Venue || model("Venue", VenueSchema);

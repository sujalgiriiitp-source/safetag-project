import { Schema, model, models } from "mongoose";

const DepositSchema = new Schema(
  {
    tokenId: { type: String, required: true, unique: true, index: true },
    visitorName: { type: String, required: true },
    visitorPhone: { type: String, required: true, index: true },
    guardianPhone: String,
    guardianName: String,
    guardianRelation: String,
    venueId: { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    venueType: { type: String, required: true },
    venueCity: String,
    venueName: String,
    itemsList: [String],
    aiDetectedItems: [String],
    operatorDetectedItems: [String],
    visitorUploadPhotoUrl: String,
    operatorCapturedPhotoUrl: String,
    itemsPhotoUrl: String,
    photoMismatchAlert: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["in_custody", "returned", "overdue", "checked_in", "collected", "unclaimed"],
      default: "in_custody"
    },
    checkedInByPhone: String,
    returnedByPhone: String,
    receivedByOperatorId: { type: Schema.Types.ObjectId, ref: "Operator" },
    collectedByOperatorId: { type: Schema.Types.ObjectId, ref: "Operator" },
    receiptPdfUrl: String,
    shortUrl: String,
    checkInTime: Date,
    returnTime: Date,
    collectionTime: Date,
    printedAt: Date,
    rating: Number,
    reviewText: String
  },
  { timestamps: true }
);

export const DepositModel = models.Deposit || model("Deposit", DepositSchema);

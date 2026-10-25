import { Schema, model, models } from "mongoose";
const assetSchema = new Schema({
  _id: String, venueId: { type: String, index: true }, custodyId: String, actor: String,
  bytes: { type: Buffer, select: false }, cloudId: String, digest: String,
  provider: { type: String, enum: ["mongo", "cloudinary"] }, mime: String,
  createdAt: Date, expiresAt: Date, deletedAt: { type: Date, default: null }
});
assetSchema.index({ expiresAt: 1, deletedAt: 1 });
export const AssetModel = models.PilotAsset || model("PilotAsset", assetSchema);

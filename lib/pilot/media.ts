import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import type { AuthSession } from "@/types";
import { AssetModel } from "@/models/PilotAsset";
import { hash, PilotError } from "@/lib/pilot/security";
import { authorize, findCustody } from "@/lib/pilot/custody";

/** Decodes and re-encodes pixels; rejects spoofed MIME, bombs, SVG and EXIF data. */
export async function sanitizePhoto(input: Uint8Array) {
  if (!input.length || input.length > 5 * 1024 * 1024) throw new PilotError(413, "PHOTO_SIZE", "Photo must be under 5 MB");
  try {
    const image = sharp(input, { limitInputPixels: 20_000_000, failOn: "error" });
    const meta = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format || "") || (meta.pages || 1) !== 1) throw new Error("Unsupported image");
    return await image.rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  } catch { throw new PilotError(400, "PHOTO_CONTENT", "Use a valid JPEG, PNG or WebP photo"); }
}

function cloud() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) throw new PilotError(503, "STORAGE", "Cloudinary private storage is not configured");
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  return cloudinary;
}

export async function savePhoto(actor: AuthSession, custodyId: string, data: Uint8Array) {
  const { operations } = await authorize(actor);
  const record = await findCustody(actor, custodyId);
  if (record.state !== "REGISTERED") throw new PilotError(409, "STATE", "Evidence is immutable once physical custody is accepted");
  const bytes = await sanitizePhoto(data);
  const _id = randomUUID();
  const provider = process.env.STORAGE_DRIVER === "cloudinary" ? "cloudinary" : "mongo";
  let cloudId: string | undefined;
  if (provider === "cloudinary") {
    const uploaded = await cloud().uploader.upload(`data:image/jpeg;base64,${bytes.toString("base64")}`, {
      public_id: `safetag-pilot/${_id}`, resource_type: "image", type: "authenticated", overwrite: false, format: "jpg"
    });
    cloudId = uploaded.public_id;
  }
  await AssetModel.create({ _id, venueId: actor.venueId, custodyId: record._id, actor: actor.operatorId,
    bytes: provider === "mongo" ? bytes : undefined, cloudId, provider, mime: "image/jpeg", digest: hash(bytes.toString("base64")),
    createdAt: new Date(), expiresAt: new Date(Date.now() + (operations?.retentionDays || 30) * 86_400_000) });
  return { assetId: _id, path: `/api/pilot/assets/${_id}`, provider };
}

export async function readPhoto(actor: AuthSession, assetId: string) {
  await authorize(actor);
  const asset = await AssetModel.findOne({ _id: assetId, venueId: actor.venueId, deletedAt: null }).select("+bytes");
  if (!asset) throw new PilotError(404, "PHOTO", "Photo not found");
  if (asset.provider === "mongo") return { bytes: Buffer.from(asset.bytes), mime: "image/jpeg" };
  // This API download URL, unlike an ordinary signed CDN URL, supports expires_at.
  const signed = cloud().utils.private_download_url(asset.cloudId, "jpg", {
    resource_type: "image", type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + 60, attachment: false
  });
  const response = await fetch(signed, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new PilotError(503, "STORAGE", "Photo provider unavailable");
  return { bytes: Buffer.from(await response.arrayBuffer()), mime: "image/jpeg" };
}

export async function purgeExpiredPhotos() {
  const due = await AssetModel.find({ expiresAt: { $lt: new Date() }, deletedAt: null }).limit(25);
  let removed = 0;
  for (const asset of due) {
    // Never delete evidence while items remain in custody or an incident is unresolved.
    const { CustodyModel } = await import("@/models/Pilot");
    const record = await CustodyModel.findById(asset.custodyId).lean();
    if (record && (!["RETURNED", "CANCELLED"].includes(record.state) || record.incident)) continue;
    if (asset.provider === "cloudinary") await cloud().uploader.destroy(asset.cloudId, { type: "authenticated", invalidate: true });
    await AssetModel.updateOne({ _id: asset._id }, { $unset: { bytes: 1, cloudId: 1 }, $set: { deletedAt: new Date() } });
    removed++;
  }
  return removed;
}

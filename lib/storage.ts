import { v2 as cloudinary } from "cloudinary";
import { isDemoMode } from "@/lib/demo-mode";

const configured =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export async function uploadBase64Asset(base64: string, folder: string, publicId: string) {
  if (!base64) return "";
  if (isDemoMode()) return base64;
  if (!configured) throw new Error("Private storage is not configured. Use the pilot photo workflow.");

  const result = await cloudinary.uploader.upload(base64, {
    folder,
    public_id: publicId,
    resource_type: "auto", type: "authenticated", overwrite: false
  });

  return result.secure_url;
}

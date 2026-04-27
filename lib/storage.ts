import { v2 as cloudinary } from "cloudinary";

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
  if (!configured) return base64;

  const result = await cloudinary.uploader.upload(base64, {
    folder,
    public_id: publicId,
    resource_type: "auto"
  });

  return result.secure_url;
}

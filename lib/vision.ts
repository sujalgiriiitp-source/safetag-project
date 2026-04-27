import vision from "@google-cloud/vision";
import { DEFAULT_ITEM_CATEGORIES } from "@/lib/constants";
import { VenueType } from "@/types";
import { parseJsonEnv } from "@/lib/utils";

const credentials = parseJsonEnv<{
  client_email: string;
  private_key: string;
}>(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

const visionClient =
  credentials && process.env.GOOGLE_VISION_PROJECT_ID
    ? new vision.ImageAnnotatorClient({
        credentials,
        projectId: process.env.GOOGLE_VISION_PROJECT_ID
      })
    : null;

const LABEL_MAP: Record<string, string> = {
  "cell phone": "Mobile Phone",
  phone: "Mobile Phone",
  smartphone: "Mobile Phone",
  wallet: "Wallet",
  purse: "Wallet",
  backpack: "Bag",
  handbag: "Bag",
  bag: "Bag",
  watch: "Watch",
  key: "Keys",
  keys: "Keys",
  camera: "Camera",
  bottle: "Water Bottle",
  water: "Water Bottle",
  shoe: "Shoes",
  footwear: "Shoes",
  umbrella: "Umbrella",
  binoculars: "Binoculars",
  id: "ID Card",
  card: "ID Card"
};

function detectFromFilename(fileName = "", venueType: VenueType) {
  const normalized = fileName.toLowerCase();
  const matches = Object.entries(LABEL_MAP)
    .filter(([needle]) => normalized.includes(needle))
    .map(([, item]) => item);

  const allowed = new Set(DEFAULT_ITEM_CATEGORIES[venueType]);
  return [...new Set(matches)].filter((item) => allowed.has(item));
}

export async function detectItemsFromImage(
  imageBase64: string,
  fileName: string,
  venueType: VenueType
) {
  const fallback = detectFromFilename(fileName, venueType);
  if (!visionClient || !imageBase64) return fallback;
  const client = visionClient;

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
  const [result] = await client.objectLocalization!({
    image: { content: cleanBase64 }
  });

  const objects = result.localizedObjectAnnotations ?? [];
  const allowed = new Set(DEFAULT_ITEM_CATEGORIES[venueType]);

  const mapped = objects
    .map((item) => LABEL_MAP[item.name?.toLowerCase() ?? ""])
    .filter(Boolean)
    .filter((item) => allowed.has(item));

  return [...new Set([...fallback, ...mapped])];
}

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to seed the database.");
  }

  const [{ connectToDatabase }, { SEED_DEPOSIT_TEMPLATES, SEED_OPERATORS, SEED_VENUES }, { VenueModel }, { OperatorModel }, { DepositModel }, { default: mongoose }] =
    await Promise.all([
      import("../lib/mongodb"),
      import("../lib/constants"),
      import("../models/Venue"),
      import("../models/Operator"),
      import("../models/Deposit"),
      import("mongoose")
    ]);

  await connectToDatabase();

  for (const { seedKey, ...venue } of SEED_VENUES) {
    await VenueModel.findOneAndUpdate(
      { name: venue.name },
      { $setOnInsert: venue },
      { upsert: true, new: true }
    );
  }

  const venues = await VenueModel.find({});
  const seedVenueByKey = new Map(SEED_VENUES.map((venue) => [venue.seedKey, venue]));
  const venueByName = new Map(venues.map((venue) => [venue.name, venue]));

  for (const { venueSeedKey, ...operator } of SEED_OPERATORS) {
    const venueName = seedVenueByKey.get(venueSeedKey)?.name;
    const venue = venueName ? venueByName.get(venueName) : null;
    if (!venue?._id) continue;

    await OperatorModel.findOneAndUpdate(
      { phone: operator.phone, venueId: venue._id },
      { $setOnInsert: { ...operator, venueId: venue._id } },
      { upsert: true, new: true }
    );
  }

  for (const template of SEED_DEPOSIT_TEMPLATES) {
    const { venueSeedKey, hoursAgo, ...deposit } = template;
    const venueName = seedVenueByKey.get(venueSeedKey)?.name;
    const venue = venueName ? venueByName.get(venueName) : null;
    if (!venue?._id) continue;

    const checkInTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const returnTime =
      deposit.status === "returned"
        ? new Date(checkInTime.getTime() + 95 * 60 * 1000)
        : undefined;

    await DepositModel.findOneAndUpdate(
      { tokenId: deposit.tokenId },
      {
        $setOnInsert: {
          ...deposit,
          venueId: venue._id,
          venueName: venue.name,
          venueCity: venue.city,
          itemsPhotoUrl: deposit.operatorCapturedPhotoUrl || deposit.visitorUploadPhotoUrl || undefined,
          checkInTime,
          createdAt: checkInTime,
          returnTime,
          collectionTime: returnTime,
          printedAt: checkInTime
        }
      },
      { upsert: true, new: true }
    );
  }

  await mongoose.disconnect();
  console.log("SafeTag seed data ready.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

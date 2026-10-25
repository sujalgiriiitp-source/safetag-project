import { randomBytes, createHash } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import mongoose from "mongoose";
import sharp from "sharp";
import { connectToDatabase } from "../lib/mongodb";
import { VenueModel } from "../models/Venue";
import { OperatorModel } from "../models/Operator";
import { CustodyModel, OperationsModel, SessionModel, RateModel } from "../models/Pilot";
import { AssetModel } from "../models/PilotAsset";
async function main() {
  const uri = process.env.MONGODB_URI || "";
  if (!uri.startsWith("mongodb://127.0.0.1:27029/safetag_test_")) throw new Error("Fixtures require the isolated local test database on port 27029");
  await connectToDatabase(); await Promise.all([CustodyModel.init(), OperationsModel.init(), SessionModel.init(), RateModel.init(), AssetModel.init()]);
  const venue = await VenueModel.create({ name: "TEST ONLY - SafeTag Pilot Counter", type: "exam", city: "Synthetic City", state: "Test", address: "Synthetic pilot test address", pincode: "226001", contactName: "Synthetic Manager", contactPhone: "+919999999991", isApproved: true });
  await OperationsModel.create({ venueId: venue._id.toString(), review: "approved", hours: "09:00 - 18:00", locations: Array.from({ length: 20 }, (_, i) => `P-${i + 1}`), acceptedItems: ["Mobile Phone", "Wallet", "Bag"], prohibitedItems: ["Weapons"], feePaise: 500, pricingTerms: "Synthetic test fee: Rs5 per deposit", retentionDays: 30 });
  const operator = await OperatorModel.create({ venueId: venue._id, name: "Synthetic Pilot Manager", phone: "+919999999991", role: "admin", isActive: true });
  const raw = randomBytes(32).toString("base64url");
  await SessionModel.create({ _id: createHash("sha256").update(raw).digest("hex"), operatorId: operator._id.toString(), venueId: venue._id.toString(), name: operator.name, phone: operator.phone, role: "admin", createdAt: new Date(), expiresAt: new Date(Date.now() + 8 * 3600_000) });
  await mkdir(".pilot-data", { recursive: true });
  async function staffSession(venueId: string, phone: string) {
    const member = await OperatorModel.create({ venueId, name: "Synthetic Browser Staff", phone, role: "operator", isActive: true });
    const cookie = randomBytes(32).toString("base64url");
    await SessionModel.create({ _id: createHash("sha256").update(cookie).digest("hex"), operatorId: member._id.toString(), venueId, name: member.name, phone, role: "operator", createdAt: new Date(), expiresAt: new Date(Date.now() + 3600_000) });
    return { cookie, operatorId: member._id.toString() };
  }
  const foreignVenue = await VenueModel.create({ name: "TEST ONLY - Other Venue", type: "exam", city: "Synthetic City", state: "Test", address: "Synthetic foreign address", pincode: "226001", contactName: "Synthetic Contact", contactPhone: "+919999999983", isApproved: true });
  const staff = await staffSession(venue._id.toString(), "+919999999982");
  const foreign = await staffSession(foreignVenue._id.toString(), "+919999999983");
  const revocable = await staffSession(venue._id.toString(), "+919999999984");
  await writeFile(".pilot-data/e2e-auth.json", JSON.stringify({ cookie: raw, venueId: venue._id.toString(), operatorId: operator._id.toString(), staff, foreign, revocable }), { mode: 0o600 });
  await sharp({ create: { width: 300, height: 180, channels: 3, background: "#0891b2" } }).jpeg().toFile(".pilot-data/items.jpg");
  console.log("Synthetic browser fixture ready. No external message sent; credentials remain in ignored .pilot-data.");
  await mongoose.disconnect();
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Fixture failed"); process.exitCode = 1; });

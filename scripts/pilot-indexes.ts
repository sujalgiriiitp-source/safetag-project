import { connectToDatabase } from "../lib/mongodb";
import { CustodyModel, OperationsModel, RateModel, SessionModel, GrantModel, InviteModel, OptOutModel, AuditModel, StaffBindingModel } from "../models/Pilot";
import { AssetModel } from "../models/PilotAsset";
import mongoose from "mongoose";
async function main() {
  if (process.env.ALLOW_INDEX_CREATION !== "true") throw new Error("Review docs/pilot/MIGRATION.md and explicitly set ALLOW_INDEX_CREATION=true against the intended staging database.");
  await connectToDatabase();
  for (const model of [CustodyModel, OperationsModel, RateModel, SessionModel, GrantModel, InviteModel, OptOutModel, AuditModel, AssetModel, StaffBindingModel]) await model.createIndexes();
  console.log("Pilot indexes created. Existing collections were not rewritten or dropped.");
  await mongoose.disconnect();
}
main().catch(() => { console.error("Index creation failed. Review configuration and migration notes."); process.exitCode = 1; });

import { setTimeout } from "node:timers/promises";
import { connectToDatabase } from "../lib/mongodb";
import { drainNotifications } from "../lib/pilot/notifications";
import { purgeExpiredPhotos } from "../lib/pilot/media";
import mongoose from "mongoose";
let stop = false;
process.on("SIGTERM", () => { stop = true; }); process.on("SIGINT", () => { stop = true; });
async function main() {
  await connectToDatabase(); let loops = 0;
  while (!stop) {
    try { const result = await drainNotifications(); if (++loops % 60 === 0) await purgeExpiredPhotos(); console.log(JSON.stringify({ event: "outbox_cycle", ...result })); }
    catch { console.error(JSON.stringify({ event: "worker_cycle_failed" })); }
    await setTimeout(10_000);
  }
  await mongoose.disconnect();
}
main().catch(() => { console.error("Worker cannot start: check database configuration"); process.exitCode = 1; });

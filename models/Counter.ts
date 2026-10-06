import { Schema, model, models } from "mongoose";

// Atomic per-key counters (e.g. deposit token sequences per venue).
// Updated via findOneAndUpdate with $inc + upsert, so concurrent check-ins
// can never generate the same sequence number.
const CounterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const CounterModel = models.Counter ?? model("Counter", CounterSchema);

import { Schema, model, models } from "mongoose";

const OperatorSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    venueId: { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    role: { type: String, enum: ["operator", "admin"], default: "operator" },
    isActive: { type: Boolean, default: true },
    totalCheckinsHandled: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const OperatorModel = models.Operator || model("Operator", OperatorSchema);

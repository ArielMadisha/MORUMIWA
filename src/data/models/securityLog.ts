// src/data/models/SecurityLog.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISecurityLog extends Document {
  level: "info" | "warn" | "error" | "audit";
  message: string;
  user?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SecurityLogSchema = new Schema<ISecurityLog>(
  {
    level: { type: String, enum: ["info", "warn", "error", "audit"], required: true },
    message: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<ISecurityLog>("SecurityLog", SecurityLogSchema);

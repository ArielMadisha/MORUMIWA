// src/data/models/Log.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ILog extends Document {
  level: "info" | "warn" | "error" | "audit";
  message: string;
  user?: mongoose.Types.ObjectId;
  meta?: Record<string, any>;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>(
  {
    level: { type: String, enum: ["info", "warn", "error", "audit"], required: true },
    message: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<ILog>("Log", LogSchema);

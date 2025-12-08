// src/data/models/Media.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMedia extends Document {
  user: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  type: "profile" | "gallery" | "task" | "general";
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer; // ⚠️ consider cloud storage for production
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: Schema.Types.ObjectId, ref: "Task" },
    type: { type: String, enum: ["profile", "gallery", "task", "general"], default: "general" },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    buffer: { type: Buffer, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IMedia>("Media", MediaSchema);

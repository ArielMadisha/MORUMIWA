// src/data/models/File.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IFile extends Document {
  task: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer; // ⚠️ consider cloud storage (S3, GCP, Azure) instead
  createdAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    buffer: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IFile>("File", FileSchema);

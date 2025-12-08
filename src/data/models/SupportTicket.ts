// src/data/models/SupportTicket.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicket extends Document {
  user: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  priority: "low" | "normal" | "high";
  status: "open" | "in-progress" | "resolved";
  response?: string;
  createdAt: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
    response: { type: String },
    respondedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

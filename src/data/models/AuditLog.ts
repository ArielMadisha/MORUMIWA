// src/data/models/AuditLog.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string; // e.g. "USER_CREATED", "TASK_CANCELLED", "PAYOUT_APPROVED"
  user?: mongoose.Types.ObjectId; // who performed the action
  target?: mongoose.Types.ObjectId; // optional target entity (user, task, etc.)
  meta?: Record<string, any>; // extra details
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    target: { type: Schema.Types.ObjectId },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

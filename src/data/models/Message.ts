// src/data/models/Message.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  task: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// Index for faster queries on unread messages per task
MessageSchema.index({ task: 1, read: 1 });

// Clean JSON output
MessageSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IMessage>("Message", MessageSchema);

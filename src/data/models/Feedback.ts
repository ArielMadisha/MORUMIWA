// src/data/models/Feedback.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IFeedback>("Feedback", FeedbackSchema);

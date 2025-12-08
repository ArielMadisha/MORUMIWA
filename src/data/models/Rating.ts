// src/data/models/Rating.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IRating extends Document {
  user: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  score: number;
  createdAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    score: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IRating>("Rating", RatingSchema);

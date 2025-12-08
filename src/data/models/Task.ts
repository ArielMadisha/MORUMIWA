// src/data/models/Task.ts
import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    status: {
      type: String,
      enum: ["posted", "accepted", "completed", "cancelled", "paid"],
      default: "posted",
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    runner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // assigned later
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

TaskSchema.index({ location: "2dsphere" }); // for geolocation queries

export default mongoose.model("Task", TaskSchema);

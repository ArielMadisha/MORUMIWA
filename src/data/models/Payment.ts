// src/data/models/Payment.ts
import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    runner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
    },
    transactionId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);

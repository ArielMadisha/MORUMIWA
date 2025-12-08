// src/data/models/Wallet.ts
import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    balance: { type: Number, default: 0 },
    transactions: [
      {
        type: {
          type: String,
          enum: ["topup", "payout", "payment", "refund"],
          required: true,
        },
        amount: { type: Number, required: true },
        reference: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", WalletSchema);

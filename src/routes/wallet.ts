// src/routes/wallet.ts
import express from "express";
import Wallet from "../data/models/Wallet";
import { authenticate } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/wallet/me
 * Get current user's wallet
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user?.id });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/wallet/topup
 * Add funds to wallet (client)
 */
router.post("/topup", authenticate, async (req, res) => {
  try {
    const { amount, reference } = req.body;
    let wallet = await Wallet.findOne({ user: req.user?.id });
    if (!wallet) wallet = new Wallet({ user: req.user?.id, balance: 0 });

    wallet.balance += amount;
    wallet.transactions.push({ type: "topup", amount, reference });
    await wallet.save();

    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: "Top-up failed" });
  }
});

/**
 * POST /api/wallet/payout
 * Runner withdraws funds
 */
router.post("/payout", authenticate, async (req, res) => {
  try {
    const { amount, reference } = req.body;
    const wallet = await Wallet.findOne({ user: req.user?.id });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    if (wallet.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

    wallet.balance -= amount;
    wallet.transactions.push({ type: "payout", amount, reference });
    await wallet.save();

    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: "Payout failed" });
  }
});

export default router;

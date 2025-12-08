// src/routes/wallet.ts
import express from "express";
import Wallet from "../data/models/Wallet";
import Transaction from "../data/models/Transaction";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/wallet/me
 * Get current user's wallet
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user?.id });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    res.json({
      success: true,
      balance: wallet.balance,
      transactions: wallet.transactions,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

/**
 * POST /api/wallet/topup
 * Add funds to wallet (client)
 */
router.post("/topup", authenticate, async (req, res) => {
  try {
    const { amount, reference } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    let wallet = await Wallet.findOne({ user: req.user?.id });
    if (!wallet) wallet = new Wallet({ user: req.user?.id, balance: 0, transactions: [] });

    wallet.balance += amount;
    const transaction = { type: "topup", amount, reference, createdAt: new Date() };
    wallet.transactions.push(transaction);
    await wallet.save();

    // Log transaction separately for analytics
    await Transaction.create({
      user: req.user?.id,
      type: "topup",
      amount,
      reference,
    });

    res.status(201).json({
      success: true,
      balance: wallet.balance,
      transaction,
    });
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
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const wallet = await Wallet.findOne({ user: req.user?.id });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    if (wallet.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

    wallet.balance -= amount;
    const transaction = { type: "payout", amount, reference, createdAt: new Date() };
    wallet.transactions.push(transaction);
    await wallet.save();

    // Log transaction separately for analytics
    await Transaction.create({
      user: req.user?.id,
      type: "payout",
      amount,
      reference,
    });

    res.status(201).json({
      success: true,
      balance: wallet.balance,
      transaction,
    });
  } catch (err) {
    res.status(500).json({ error: "Payout failed" });
  }
});

/**
 * GET /api/wallet/admin/:userId
 * Admin/SuperAdmin: View a specific user's wallet
 */
router.get("/admin/:userId", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.params.userId });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    res.json({
      success: true,
      user: req.params.userId,
      balance: wallet.balance,
      transactions: wallet.transactions,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user wallet" });
  }
});

export default router;

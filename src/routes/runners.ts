// src/routes/runners.ts
import express from "express";
import Task from "../data/models/Task";
import Wallet from "../data/models/Wallet";
import Transaction from "../data/models/Transaction";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/runners/tasks
 * Get all tasks assigned to the current runner (with pagination)
 */
router.get("/tasks", authenticate, authorize(["runner"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({ runner: req.user?.id })
      .populate("client", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments({ runner: req.user?.id });

    res.json({
      success: true,
      count: tasks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch runner tasks" });
  }
});

/**
 * GET /api/runners/tasks/available
 * Get all available tasks (status = posted)
 */
router.get("/tasks/available", authenticate, authorize(["runner"]), async (req, res) => {
  try {
    const tasks = await Task.find({ status: "posted" })
      .populate("client", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch available tasks" });
  }
});

/**
 * PUT /api/runners/tasks/:id/accept
 * Runner accepts a task
 */
router.put("/tasks/:id/accept", authenticate, authorize(["runner"]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.status !== "posted") return res.status(400).json({ error: "Task not available" });

    task.status = "accepted";
    task.runner = req.user?.id;
    task.acceptedAt = new Date();
    await task.save();

    res.json({
      success: true,
      task,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to accept task" });
  }
});

/**
 * GET /api/runners/wallet
 * Get runner wallet balance
 */
router.get("/wallet", authenticate, authorize(["runner"]), async (req, res) => {
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
 * POST /api/runners/payout
 * Request payout from runner wallet
 */
router.post("/payout", authenticate, authorize(["runner"]), async (req, res) => {
  try {
    const { amount, reference } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const wallet = await Wallet.findOne({ user: req.user?.id });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    wallet.balance -= amount;
    const walletTransaction = { type: "payout", amount, reference, createdAt: new Date() };
    wallet.transactions.push(walletTransaction);
    await wallet.save();

    const transaction = await Transaction.create({
      user: req.user?.id,
      type: "payout",
      amount,
      reference,
    });

    res.status(201).json({
      success: true,
      message: "Payout requested successfully",
      balance: wallet.balance,
      transaction,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to request payout" });
  }
});

export default router;

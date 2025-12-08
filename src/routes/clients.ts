// src/routes/clients.ts
import express from "express";
import Task from "../data/models/Task";
import Wallet from "../data/models/Wallet";
import Transaction from "../data/models/Transaction";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/clients/tasks
 * Get all tasks posted by the current client (with pagination)
 */
router.get("/tasks", authenticate, authorize(["client"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({ client: req.user?.id })
      .populate("runner", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments({ client: req.user?.id });

    res.json({
      success: true,
      count: tasks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch client tasks" });
  }
});

/**
 * POST /api/clients/tasks
 * Post a new task
 */
router.post("/tasks", authenticate, authorize(["client"]), async (req, res) => {
  try {
    const { title, description, budget, location } = req.body;
    if (!title || !description || !budget) {
      return res.status(400).json({ error: "Title, description, and budget are required" });
    }
    if (budget <= 0) {
      return res.status(400).json({ error: "Budget must be greater than 0" });
    }

    const task = new Task({
      title,
      description,
      budget,
      location,
      client: req.user?.id,
      status: "posted",
      createdAt: new Date(),
    });
    await task.save();

    res.status(201).json({
      success: true,
      task,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to post task" });
  }
});

/**
 * GET /api/clients/wallet
 * Get client wallet balance
 */
router.get("/wallet", authenticate, authorize(["client"]), async (req, res) => {
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
 * GET /api/clients/transactions
 * Get client transaction history
 */
router.get("/transactions", authenticate, authorize(["client"]), async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user?.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;

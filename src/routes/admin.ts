// src/routes/admin.ts
import express from "express";
import User from "../data/models/User";
import Task from "../data/models/Task";
import Wallet from "../data/models/Wallet";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
router.get("/users", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only)
 */
router.delete("/users/:id", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/**
 * GET /api/admin/tasks
 * List all tasks (admin only)
 */
router.get("/tasks", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const tasks = await Task.find().populate("client runner", "name role");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

/**
 * PUT /api/admin/tasks/:id/cancel
 * Force-cancel a task (admin only)
 */
router.put("/tasks/:id/cancel", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = "cancelled";
    await task.save();

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel task" });
  }
});

/**
 * POST /api/admin/payouts/:userId
 * Approve payout for a runner (admin only)
 */
router.post("/payouts/:userId", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const { amount, reference } = req.body;
    const wallet = await Wallet.findOne({ user: req.params.userId });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    if (wallet.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

    wallet.balance -= amount;
    wallet.transactions.push({ type: "payout", amount, reference });
    await wallet.save();

    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: "Failed to approve payout" });
  }
});

export default router;

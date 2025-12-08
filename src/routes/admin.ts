// src/routes/admin.ts
import express from "express";
import User from "../data/models/User";
import Task from "../data/models/Task";
import Wallet from "../data/models/Wallet";
import Transaction from "../data/models/Transaction";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/admin/users
 * List all users (admin/superadmin) with pagination
 */
router.get("/users", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find().select("-passwordHash").skip(skip).limit(limit);
    const total = await User.countDocuments();

    res.json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin/superadmin)
 */
router.delete("/users/:id", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      message: "User deleted successfully",
      userId: req.params.id,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/**
 * GET /api/admin/tasks
 * List all tasks (admin/superadmin) with pagination
 */
router.get("/tasks", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const tasks = await Task.find()
      .populate("client runner", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments();

    res.json({
      success: true,
      count: tasks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

/**
 * PUT /api/admin/tasks/:id/cancel
 * Force-cancel a task (admin/superadmin)
 */
router.put("/tasks/:id/cancel", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.status === "completed") {
      return res.status(400).json({ error: "Cannot cancel a completed task" });
    }

    task.status = "cancelled";
    task.cancelledAt = new Date();
    await task.save();

    res.json({
      success: true,
      task,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel task" });
  }
});

/**
 * POST /api/admin/payouts/:userId
 * Approve payout for a runner (admin/superadmin)
 */
router.post("/payouts/:userId", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const { amount, reference } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const wallet = await Wallet.findOne({ user: req.params.userId });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    if (wallet.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

    wallet.balance -= amount;
    const walletTransaction = { type: "payout", amount, reference, createdAt: new Date() };
    wallet.transactions.push(walletTransaction);
    await wallet.save();

    // Log transaction separately for analytics
    const transaction = await Transaction.create({
      user: req.params.userId,
      type: "payout",
      amount,
      reference,
    });

    res.status(201).json({
      success: true,
      message: "Payout approved successfully",
      balance: wallet.balance,
      transaction,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve payout" });
  }
});

export default router;

// src/routes/transactions.ts
import express from "express";
import Transaction from "../data/models/Transaction";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/transactions
 * Admin/SuperAdmin: Get all transactions (with pagination)
 */
router.get("/", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments();

    res.json({
      success: true,
      count: transactions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

/**
 * GET /api/transactions/:id
 * Admin/SuperAdmin: Get a specific transaction
 */
router.get("/:id", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate("user", "name email role");
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    res.json({
      success: true,
      transaction,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

/**
 * GET /api/transactions/filter
 * Admin/SuperAdmin: Filter transactions by type, user, or date range
 */
router.get("/filter", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const { type, userId, startDate, endDate } = req.query;
    const filter: any = {};

    if (type) filter.type = type;
    if (userId) filter.user = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const transactions = await Transaction.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to filter transactions" });
  }
});

/**
 * GET /api/transactions/my
 * User: Get own transactions
 */
router.get("/my", authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user?.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user transactions" });
  }
});

export default router;

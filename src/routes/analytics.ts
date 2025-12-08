// src/routes/analytics.ts
import express from "express";
import User from "../data/models/User";
import Task from "../data/models/Task";
import Payment from "../data/models/Payment";
import Review from "../data/models/Review";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/analytics/overview
 * Platform overview stats
 */
router.get("/overview", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "successful" } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      users: totalUsers,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
      },
      revenue: totalRevenue[0]?.sum || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics overview" });
  }
});

/**
 * GET /api/analytics/tasks/weekly
 * Tasks created per week
 */
router.get("/tasks/weekly", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const weeklyTasks = await Task.aggregate([
      {
        $group: {
          _id: { week: { $isoWeek: "$createdAt" }, year: { $isoWeekYear: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    res.json({
      success: true,
      count: weeklyTasks.length,
      weeklyTasks,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weekly tasks" });
  }
});

/**
 * GET /api/analytics/revenue/monthly
 * Revenue growth per month
 */
router.get("/revenue/monthly", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: "successful" } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      count: monthlyRevenue.length,
      monthlyRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch monthly revenue" });
  }
});

/**
 * GET /api/analytics/runners/performance
 * Runner performance stats (average rating, completed tasks)
 */
router.get("/runners/performance", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const runners = await User.find({ role: "runner" });
    const performance = await Promise.all(
      runners.map(async (runner) => {
        const completedTasks = await Task.countDocuments({ runner: runner._id, status: "completed" });
        const reviews = await Review.find({ reviewee: runner._id });
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        return {
          runnerId: runner._id,
          runnerName: runner.name,
          completedTasks,
          avgRating: Number(avgRating.toFixed(2)),
        };
      })
    );

    res.json({
      success: true,
      count: performance.length,
      performance,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch runner performance" });
  }
});

/**
 * GET /api/analytics/tasks/daily
 * Daily tasks trend (last 7 days)
 */
router.get("/tasks/daily", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const dailyTasks = await Task.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]);

    res.json({
      success: true,
      count: dailyTasks.length,
      dailyTasks: dailyTasks.reverse(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily tasks" });
  }
});

/**
 * GET /api/analytics/revenue/weekly
 * Weekly revenue growth
 */
router.get("/revenue/weekly", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const weeklyRevenue = await Payment.aggregate([
      { $match: { status: "successful" } },
      {
        $group: {
          _id: { week: { $isoWeek: "$createdAt" }, year: { $isoWeekYear: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.week": -1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      count: weeklyRevenue.length,
      weeklyRevenue: weeklyRevenue.reverse(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weekly revenue" });
  }
});

/**
 * GET /api/analytics/users/activity
 * Active users in last 30 days
 */
router.get("/users/activity", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const activeClients = await Task.distinct("client", {
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const activeRunners = await Task.distinct("runner", {
      acceptedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      success: true,
      activeClients: activeClients.length,
      activeRunners: activeRunners.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
});

export default router;

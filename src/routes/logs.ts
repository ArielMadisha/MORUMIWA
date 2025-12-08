// src/routes/logs.ts
import express from "express";
import Log from "../data/models/Log"; // <-- you'll need a Log model
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/logs
 * SuperAdmin: Get all logs (with pagination)
 */
router.get("/", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Log.countDocuments();

    res.json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

/**
 * GET /api/logs/:id
 * SuperAdmin: Get a specific log entry
 */
router.get("/:id", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    if (!log) return res.status(404).json({ error: "Log not found" });

    res.json({
      success: true,
      log,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch log entry" });
  }
});

/**
 * DELETE /api/logs/:id
 * SuperAdmin: Delete a specific log entry
 */
router.delete("/:id", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const log = await Log.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ error: "Log not found" });

    res.json({
      success: true,
      message: "Log deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete log entry" });
  }
});

/**
 * DELETE /api/logs
 * SuperAdmin: Clear all logs
 */
router.delete("/", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    await Log.deleteMany({});
    res.json({
      success: true,
      message: "All logs cleared successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear logs" });
  }
});

export default router;

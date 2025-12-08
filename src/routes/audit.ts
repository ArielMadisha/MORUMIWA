// src/routes/audit.ts
import express from "express";
import AuditLog from "../data/models/AuditLog"; // <-- you'll need an AuditLog model
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/audit
 * SuperAdmin: Get all audit logs (with pagination)
 */
router.get("/", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments();

    res.json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

/**
 * GET /api/audit/:id
 * SuperAdmin: Get a specific audit log entry
 */
router.get("/:id", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate("user", "name email role");
    if (!log) return res.status(404).json({ error: "Audit log not found" });

    res.json({
      success: true,
      log,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit log entry" });
  }
});

/**
 * DELETE /api/audit/:id
 * SuperAdmin: Delete a specific audit log entry
 */
router.delete("/:id", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const log = await AuditLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ error: "Audit log not found" });

    res.json({
      success: true,
      message: "Audit log deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete audit log entry" });
  }
});

/**
 * DELETE /api/audit
 * SuperAdmin: Clear all audit logs
 */
router.delete("/", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    await AuditLog.deleteMany({});
    res.json({
      success: true,
      message: "All audit logs cleared successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear audit logs" });
  }
});

export default router;

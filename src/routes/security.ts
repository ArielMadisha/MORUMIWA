// src/routes/security.ts
import express from "express";
import User from "../data/models/User";
import SecurityLog from "../data/models/SecurityLog"; // <-- you'll need a SecurityLog model
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/security/logs
 * SuperAdmin: View all security logs (with pagination)
 */
router.get("/logs", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const logs = await SecurityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SecurityLog.countDocuments();

    res.json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch security logs" });
  }
});

/**
 * PUT /api/security/users/:id/lock
 * SuperAdmin: Lock a user account
 */
router.put("/users/:id/lock", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { locked: true },
      { new: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ error: "User not found" });

    await SecurityLog.create({
      level: "audit",
      message: `User ${user.email} account locked by superadmin`,
      user: user._id,
    });

    res.json({
      success: true,
      message: "User account locked successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to lock user account" });
  }
});

/**
 * PUT /api/security/users/:id/unlock
 * SuperAdmin: Unlock a user account
 */
router.put("/users/:id/unlock", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { locked: false },
      { new: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ error: "User not found" });

    await SecurityLog.create({
      level: "audit",
      message: `User ${user.email} account unlocked by superadmin`,
      user: user._id,
    });

    res.json({
      success: true,
      message: "User account unlocked successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to unlock user account" });
  }
});

/**
 * GET /api/security/audit/roles
 * SuperAdmin: Audit user roles
 */
router.get("/audit/roles", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const users = await User.find().select("name email role locked active");
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to audit user roles" });
  }
});

export default router;

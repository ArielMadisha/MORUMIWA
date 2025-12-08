// src/routes/superadmin.ts
import express from "express";
import User from "../data/models/User";
import { authenticate, authorize } from "../middleware/auth";
import { sendRealtimeNotification } from "../services/notification";

const router = express.Router();

/**
 * POST /api/superadmin/admins
 * Create a new admin account
 */
router.post("/admins", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const admin = new User({ name, email, password, role: "admin", active: true });
    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create admin" });
  }
});

/**
 * GET /api/superadmin/admins
 * List all admins with pagination
 */
router.get("/admins", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const admins = await User.find({ role: "admin" })
      .select("-passwordHash")
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: "admin" });

    res.json({
      success: true,
      count: admins.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      admins,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

/**
 * PUT /api/superadmin/admins/:id/deactivate
 * Deactivate an admin account
 */
router.put("/admins/:id/deactivate", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const admin = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    ).select("-passwordHash");

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    res.json({
      success: true,
      message: "Admin deactivated successfully",
      admin,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to deactivate admin" });
  }
});

/**
 * PUT /api/superadmin/users/:id/role
 * Change a user's role (promote/demote)
 */
router.put("/users/:id/role", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: "Role is required" });

    const validRoles = ["client", "runner", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user role" });
  }
});

/**
 * POST /api/superadmin/broadcast
 * Send a broadcast notification to all users
 */
router.post("/broadcast", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    sendRealtimeNotification("all", "broadcast", { message, timestamp: new Date() });

    res.json({
      success: true,
      message: "Broadcast sent successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send broadcast" });
  }
});

export default router;

// src/routes/users.ts
import express from "express";
import User from "../data/models/User";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/users/me
 * Get the current user's profile
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user?.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PUT /api/users/me
 * Update current user's profile
 */
router.put("/me", authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user?.id, updates, {
      new: true,
    }).select("-passwordHash");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/users/:id
 * Admin-only: Get a specific user's profile
 */
router.get("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

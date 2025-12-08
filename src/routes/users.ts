// src/routes/users.ts
import express from "express";
import User from "../data/models/User";
import { authenticate, authorize } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { saveFile, getFileUrl } from "../services/storage"; // <-- new import

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
 * POST /api/users/profile/upload
 * Upload a profile picture
 */
router.post("/profile/upload", authenticate, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Save file and get URL via storage service
    const filePath = await saveFile(req.file);
    const fileUrl = getFileUrl(req.file.filename);

    // Update user's profile with avatar URL
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { avatar: fileUrl },
      { new: true }
    ).select("-passwordHash");

    res.json({
      message: "Profile picture uploaded successfully",
      file: {
        filename: req.file.filename,
        path: filePath,
        url: fileUrl,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload profile picture" });
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

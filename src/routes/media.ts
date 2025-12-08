// src/routes/media.ts
import express from "express";
import multer from "multer";
import Media from "../data/models/Media"; // <-- you'll need a Media model
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

// Configure multer for media uploads
const upload = multer({
  storage: multer.memoryStorage(), // ⚠️ consider cloud storage for production
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
});

/**
 * POST /api/media/upload
 * Upload media (profile picture, gallery image, task attachment)
 */
router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { type, taskId } = req.body;
    if (!req.file) return res.status(400).json({ error: "File is required" });

    const media = new Media({
      user: req.user?.id,
      task: taskId || null,
      type: type || "general", // e.g. profile, gallery, task
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
      createdAt: new Date(),
      status: "pending", // pending moderation
    });

    await media.save();

    res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      media: {
        id: media._id,
        type: media.type,
        filename: media.filename,
        mimetype: media.mimetype,
        size: media.size,
        status: media.status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload media" });
  }
});

/**
 * GET /api/media/user/:userId
 * Get all media for a user
 */
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    const media = await Media.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: media.length,
      media,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user media" });
  }
});

/**
 * GET /api/media/task/:taskId
 * Get all media for a task
 */
router.get("/task/:taskId", authenticate, async (req, res) => {
  try {
    const media = await Media.find({ task: req.params.taskId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: media.length,
      media,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task media" });
  }
});

/**
 * PUT /api/media/:id/approve
 * Admin/SuperAdmin: Approve media
 */
router.put("/:id/approve", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: "Media not found" });

    media.status = "approved";
    media.approvedAt = new Date();
    await media.save();

    res.json({
      success: true,
      message: "Media approved successfully",
      media,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve media" });
  }
});

/**
 * PUT /api/media/:id/reject
 * Admin/SuperAdmin: Reject media
 */
router.put("/:id/reject", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: "Media not found" });

    media.status = "rejected";
    media.rejectedAt = new Date();
    await media.save();

    res.json({
      success: true,
      message: "Media rejected successfully",
      media,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject media" });
  }
});

/**
 * DELETE /api/media/:id
 * Admin/SuperAdmin: Delete media
 */
router.delete("/:id", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);
    if (!media) return res.status(404).json({ error: "Media not found" });

    res.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete media" });
  }
});

export default router;

// src/routes/files.ts
import express from "express";
import multer from "multer";
import File from "../data/models/File"; // <-- you'll need a File model
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // or diskStorage if you prefer
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

/**
 * POST /api/files/upload
 * Upload a file tied to a task
 */
router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId || !req.file) {
      return res.status(400).json({ error: "taskId and file are required" });
    }

    const file = new File({
      task: taskId,
      user: req.user?.id,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer, // ⚠️ consider cloud storage instead of DB
      createdAt: new Date(),
    });

    await file.save();

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: {
        id: file._id,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        task: file.task,
        user: file.user,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload file" });
  }
});

/**
 * GET /api/files/task/:taskId
 * Get all files for a task
 */
router.get("/task/:taskId", authenticate, async (req, res) => {
  try {
    const files = await File.find({ task: req.params.taskId })
      .populate("user", "name role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: files.length,
      files,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

/**
 * GET /api/files/:id
 * Download a file
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.setHeader("Content-Type", file.mimetype);
    res.setHeader("Content-Disposition", `attachment; filename=${file.filename}`);
    res.send(file.buffer);
  } catch (err) {
    res.status(500).json({ error: "Failed to download file" });
  }
});

/**
 * DELETE /api/files/:id
 * Admin/SuperAdmin: Delete a file
 */
router.delete("/:id", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;

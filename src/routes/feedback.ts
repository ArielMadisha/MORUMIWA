// src/routes/feedback.ts
import express from "express";
import Feedback from "../data/models/Feedback"; // <-- you'll need a Feedback model
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/feedback
 * User: Submit feedback (rating + comment)
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { taskId, rating, comment } = req.body;
    if (!taskId || !rating) {
      return res.status(400).json({ error: "taskId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const feedback = new Feedback({
      user: req.user?.id,
      task: taskId,
      rating,
      comment: comment?.trim(),
      createdAt: new Date(),
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

/**
 * GET /api/feedback/my
 * User: View own feedback
 */
router.get("/my", authenticate, async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user?.id })
      .populate("task", "title status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedback.length,
      feedback,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

/**
 * GET /api/feedback/task/:taskId
 * Admin/SuperAdmin: View feedback for a specific task
 */
router.get("/task/:taskId", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const feedback = await Feedback.find({ task: req.params.taskId })
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedback.length,
      feedback,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task feedback" });
  }
});

/**
 * GET /api/feedback
 * Admin/SuperAdmin: View all feedback (with pagination)
 */
router.get("/", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find()
      .populate("user", "name email role")
      .populate("task", "title status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments();

    res.json({
      success: true,
      count: feedback.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      feedback,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

export default router;

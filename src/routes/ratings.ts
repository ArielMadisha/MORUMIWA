// src/routes/ratings.ts
import express from "express";
import Rating from "../data/models/Rating"; // <-- you'll need a Rating model
import Task from "../data/models/Task";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/ratings
 * User: Submit a rating for a task or service
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { taskId, score } = req.body;
    if (!taskId || !score) {
      return res.status(400).json({ error: "taskId and score are required" });
    }
    if (score < 1 || score > 5) {
      return res.status(400).json({ error: "Score must be between 1 and 5" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const existingRating = await Rating.findOne({ task: taskId, user: req.user?.id });
    if (existingRating) return res.status(400).json({ error: "You already rated this task" });

    const rating = new Rating({
      task: taskId,
      user: req.user?.id,
      score,
      createdAt: new Date(),
    });

    await rating.save();

    res.status(201).json({
      success: true,
      message: "Rating submitted successfully",
      rating,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit rating" });
  }
});

/**
 * GET /api/ratings/task/:taskId
 * Get all ratings for a task
 */
router.get("/task/:taskId", authenticate, async (req, res) => {
  try {
    const ratings = await Rating.find({ task: req.params.taskId })
      .populate("user", "name role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ratings.length,
      ratings,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task ratings" });
  }
});

/**
 * GET /api/ratings/task/:taskId/average
 * Get average rating for a task
 */
router.get("/task/:taskId/average", authenticate, async (req, res) => {
  try {
    const result = await Rating.aggregate([
      { $match: { task: req.params.taskId } },
      { $group: { _id: null, avgScore: { $avg: "$score" }, count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      averageScore: result[0]?.avgScore || 0,
      totalRatings: result[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate average rating" });
  }
});

/**
 * GET /api/ratings
 * Admin/SuperAdmin: View all ratings (with pagination)
 */
router.get("/", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const ratings = await Rating.find()
      .populate("user", "name email role")
      .populate("task", "title status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Rating.countDocuments();

    res.json({
      success: true,
      count: ratings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      ratings,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

/**
 * DELETE /api/ratings/:id
 * Admin/SuperAdmin: Delete a rating
 */
router.delete("/:id", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    if (!rating) return res.status(404).json({ error: "Rating not found" });

    res.json({
      success: true,
      message: "Rating deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete rating" });
  }
});

export default router;

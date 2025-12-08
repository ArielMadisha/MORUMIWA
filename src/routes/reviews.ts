// src/routes/reviews.ts
import express from "express";
import Review from "../data/models/Review";
import Task from "../data/models/Task";
import { authenticate } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/reviews
 * Create a review (client → runner or runner → client)
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { taskId, rating, comment } = req.body;

    // Ensure task exists
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Prevent duplicate reviews
    const existingReview = await Review.findOne({ task: taskId, reviewer: req.user?.id });
    if (existingReview) return res.status(400).json({ error: "You already reviewed this task" });

    const review = new Review({
      task: taskId,
      reviewer: req.user?.id,
      reviewee: task.runner || task.client, // depending on who is reviewing
      rating,
      comment,
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/reviews/:userId
 * Get all reviews for a specific user
 */
router.get("/:userId", async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate("reviewer", "name role")
      .populate("task", "title status");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

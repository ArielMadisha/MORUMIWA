// src/routes/reviews.ts
import express from "express";
import Review from "../data/models/Review";
import Task from "../data/models/Task";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/reviews
 * Create a review (client → runner or runner → client)
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

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const existingReview = await Review.findOne({ task: taskId, reviewer: req.user?.id });
    if (existingReview) return res.status(400).json({ error: "You already reviewed this task" });

    const review = new Review({
      task: taskId,
      reviewer: req.user?.id,
      reviewee: task.runner || task.client,
      rating,
      comment: comment?.trim(),
      createdAt: new Date(),
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create review" });
  }
});

/**
 * GET /api/reviews/:userId
 * Get all reviews for a specific user (with pagination)
 */
router.get("/:userId", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate("reviewer", "name role")
      .populate("task", "title status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ reviewee: req.params.userId });

    res.json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      reviews,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

/**
 * GET /api/reviews/:userId/average
 * Get average rating for a user
 */
router.get("/:userId/average", async (req, res) => {
  try {
    const result = await Review.aggregate([
      { $match: { reviewee: req.params.userId } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      averageRating: result[0]?.avgRating || 0,
      totalReviews: result[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate average rating" });
  }
});

/**
 * GET /api/reviews
 * Admin/SuperAdmin: View all reviews (with pagination)
 */
router.get("/", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const reviews = await Review.find()
      .populate("reviewer", "name email role")
      .populate("reviewee", "name email role")
      .populate("task", "title status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments();

    res.json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      reviews,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all reviews" });
  }
});

/**
 * DELETE /api/reviews/:id
 * Admin/SuperAdmin: Delete a review
 */
router.delete("/:id", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;

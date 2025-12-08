// src/routes/tasks.ts
import express from "express";
import Task from "../data/models/Task";
import Transaction from "../data/models/Transaction";
import { authenticate, authorize } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = express.Router();

/**
 * POST /api/tasks
 * Client posts a new task
 */
router.post("/", authenticate, authorize(["client"]), async (req, res) => {
  try {
    const { title, description, budget, location } = req.body;

    if (!title || !description || !budget) {
      return res.status(400).json({ error: "Title, description, and budget are required" });
    }
    if (budget <= 0) {
      return res.status(400).json({ error: "Budget must be greater than 0" });
    }

    const task = new Task({
      title,
      description,
      budget,
      location,
      client: req.user?.id,
      status: "posted",
      createdAt: new Date(),
    });

    await task.save();

    res.status(201).json({
      success: true,
      task,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

/**
 * PUT /api/tasks/:id/accept
 * Runner accepts a task
 */
router.put("/:id/accept", authenticate, authorize(["runner"]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.status !== "posted") return res.status(400).json({ error: "Task not available" });

    task.status = "accepted";
    task.runner = req.user?.id;
    task.acceptedAt = new Date();
    await task.save();

    res.json({
      success: true,
      task,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to accept task" });
  }
});

/**
 * PUT /api/tasks/:id/complete
 * Runner marks task as completed
 */
router.put("/:id/complete", authenticate, authorize(["runner"]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.status !== "accepted") return res.status(400).json({ error: "Task not in progress" });

    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    // Log transaction for payout
    await Transaction.create({
      user: task.runner,
      type: "payout",
      amount: task.budget,
      reference: `TASK-${task._id}`,
    });

    res.json({
      success: true,
      task,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete task" });
  }
});

/**
 * PUT /api/tasks/:id/cancel
 * Client cancels a task
 */
router.put("/:id/cancel", authenticate, authorize(["client"]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.status === "completed") return res.status(400).json({ error: "Cannot cancel completed task" });

    task.status = "cancelled";
    task.cancelledAt = new Date();
    await task.save();

    res.json({
      success: true,
      task,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel task" });
  }
});

/**
 * POST /api/tasks/:id/upload
 * Upload an attachment for a task
 */
router.post("/:id/upload", authenticate, authorize(["client"]), upload.single("attachment"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.attachments = task.attachments || [];
    task.attachments.push({
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    });

    await task.save();

    res.json({
      success: true,
      message: "Attachment uploaded successfully",
      file: req.file,
      task,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

/**
 * GET /api/tasks/admin
 * Admin/SuperAdmin: View all tasks with pagination
 */
router.get("/admin", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const tasks = await Task.find()
      .populate("client", "name email")
      .populate("runner", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments();

    res.json({
      success: true,
      count: tasks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

export default router;

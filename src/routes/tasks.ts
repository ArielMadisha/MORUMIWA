// src/routes/tasks.ts
import express from "express";
import Task from "../data/models/Task";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/tasks
 * Client posts a new task
 */
router.post("/", authenticate, authorize(["client"]), async (req, res) => {
  try {
    const { title, description, budget, location } = req.body;
    const task = new Task({
      title,
      description,
      budget,
      location,
      client: req.user?.id,
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
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

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
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

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
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
    await task.save();

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

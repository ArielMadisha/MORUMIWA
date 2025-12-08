// src/routes/matching.ts
import express from "express";
import { authenticate, authorize } from "../middleware/auth";
import { findBestRunner } from "../services/matching";

const router = express.Router();

/**
 * GET /api/matching/:taskId
 * Suggest best runner for a task
 */
router.get("/:taskId", authenticate, authorize(["client", "admin"]), async (req, res) => {
  try {
    const runner = await findBestRunner(req.params.taskId);
    if (!runner) return res.status(404).json({ error: "No suitable runner found" });
    res.json(runner);
  } catch (err) {
    res.status(500).json({ error: "Matching failed" });
  }
});

export default router;

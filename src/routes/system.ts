// src/routes/system.ts
import express from "express";
import os from "os";
import process from "process";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/system/health
 * Admin/SuperAdmin: Basic health check
 */
router.get("/health", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    res.json({
      success: true,
      status: "ok",
      timestamp: new Date(),
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch system health" });
  }
});

/**
 * GET /api/system/status
 * Admin/SuperAdmin: Detailed system status
 */
router.get("/status", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    res.json({
      success: true,
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: process.memoryUsage(),
      },
      cpu: {
        cores: os.cpus().length,
        load: os.loadavg(),
      },
      platform: {
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
      },
      node: {
        version: process.version,
        pid: process.pid,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch system status" });
  }
});

/**
 * GET /api/system/uptime
 * Admin/SuperAdmin: Uptime monitoring
 */
router.get("/uptime", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    res.json({
      success: true,
      uptimeSeconds: process.uptime(),
      uptimeHours: (process.uptime() / 3600).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch uptime" });
  }
});

export default router;

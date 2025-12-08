// src/routes/settings.ts
import express from "express";
import Setting from "../data/models/Setting"; // <-- you'll need a Setting model
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/settings
 * SuperAdmin: Get all platform settings
 */
router.get("/", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json({
      success: true,
      count: settings.length,
      settings,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * PUT /api/settings/:key
 * SuperAdmin: Update a specific setting
 */
router.put("/:key", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: "Value is required" });
    }

    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: `Setting '${req.params.key}' updated successfully`,
      setting,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update setting" });
  }
});

/**
 * DELETE /api/settings/:key
 * SuperAdmin: Remove a setting
 */
router.delete("/:key", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const setting = await Setting.findOneAndDelete({ key: req.params.key });
    if (!setting) return res.status(404).json({ error: "Setting not found" });

    res.json({
      success: true,
      message: `Setting '${req.params.key}' deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete setting" });
  }
});

export default router;

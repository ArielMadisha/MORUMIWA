// src/routes/notifications.ts
import express from "express";
import Notification from "../data/models/Notification";
import { authenticate, authorize } from "../middleware/auth";
import { sendRealtimeNotification, sendEmailNotification } from "../services/notification";

const router = express.Router();

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user?.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      notification,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

/**
 * POST /api/notifications/user/:userId
 * Admin/SuperAdmin: Send a notification to a specific user
 */
router.post("/user/:userId", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const { message, channel } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const notification = await Notification.create({
      user: req.params.userId,
      message,
      channel: channel || "realtime",
      read: false,
      createdAt: new Date(),
    });

    if (channel === "email") {
      await sendEmailNotification(req.params.userId, "System Notification", message);
    } else {
      sendRealtimeNotification(req.params.userId, "notification", { message });
    }

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send notification" });
  }
});

/**
 * POST /api/notifications/broadcast
 * SuperAdmin: Broadcast a notification to all users
 */
router.post("/broadcast", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { type, message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const notification = new Notification({
      user: null, // broadcast
      type: type || "broadcast",
      message,
      read: false,
      createdAt: new Date(),
    });
    await notification.save();

    sendRealtimeNotification("all", type || "broadcast", { message });

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to broadcast notification" });
  }
});

/**
 * GET /api/notifications/admin
 * Admin/SuperAdmin: View all notifications (with pagination)
 */
router.get("/admin", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments();

    res.json({
      success: true,
      count: notifications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      notifications,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * DELETE /api/notifications/:id
 * Admin/SuperAdmin: Delete a notification
 */
router.delete("/:id", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;

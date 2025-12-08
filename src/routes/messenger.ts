// src/routes/messenger.ts
import express from "express";
import Message from "../data/models/Message";
import { authenticate, authorize } from "../middleware/auth";
import { sendRealtimeNotification } from "../services/notification";

const router = express.Router();

/**
 * POST /api/messenger/send
 * Send a message between client and runner
 */
router.post("/send", authenticate, async (req, res) => {
  try {
    const { taskId, receiverId, content } = req.body;

    if (!taskId || !receiverId || !content) {
      return res.status(400).json({ error: "taskId, receiverId, and content are required" });
    }
    if (content.trim().length > 1000) {
      return res.status(400).json({ error: "Message content exceeds 1000 characters" });
    }

    const message = new Message({
      task: taskId,
      sender: req.user?.id,
      receiver: receiverId,
      content: content.trim(),
      read: false,
      createdAt: new Date(),
    });

    await message.save();

    // Optional realtime push
    sendRealtimeNotification(receiverId, "message", {
      taskId,
      sender: req.user?.id,
      content: message.content,
      createdAt: message.createdAt,
    });

    res.status(201).json({
      success: true,
      message,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * GET /api/messenger/task/:taskId
 * Get all messages for a task (with pagination)
 */
router.get("/task/:taskId", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ task: req.params.taskId })
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ task: req.params.taskId });

    res.json({
      success: true,
      count: messages.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      messages,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * PUT /api/messenger/:id/read
 * Mark a message as read
 */
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (String(message.receiver) !== String(req.user?.id)) {
      return res.status(403).json({ error: "You are not authorized to mark this message as read" });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.json({
      success: true,
      message,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});

/**
 * GET /api/messenger/unread/:taskId
 * Get unread messages for a task
 */
router.get("/unread/:taskId", authenticate, async (req, res) => {
  try {
    const unreadMessages = await Message.find({
      task: req.params.taskId,
      receiver: req.user?.id,
      read: false,
    })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: unreadMessages.length,
      messages: unreadMessages,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unread messages" });
  }
});

/**
 * GET /api/messenger/admin/:taskId
 * Admin/SuperAdmin: View all messages for moderation
 */
router.get("/admin/:taskId", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const messages = await Message.find({ task: req.params.taskId })
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages for moderation" });
  }
});

export default router;

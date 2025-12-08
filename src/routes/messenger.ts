// src/routes/messenger.ts
import express from "express";
import Message from "../data/models/Message";
import { authenticate } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/messenger/send
 * Send a message between client and runner
 */
router.post("/send", authenticate, async (req, res) => {
  try {
    const { taskId, receiverId, content } = req.body;

    const message = new Message({
      task: taskId,
      sender: req.user?.id,
      receiver: receiverId,
      content,
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * GET /api/messenger/task/:taskId
 * Get all messages for a task
 */
router.get("/task/:taskId", authenticate, async (req, res) => {
  try {
    const messages = await Message.find({ task: req.params.taskId })
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .sort({ createdAt: 1 });

    res.json(messages);
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

    message.read = true;
    await message.save();

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});

export default router;

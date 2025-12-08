// src/routes/support.ts
import express from "express";
import SupportTicket from "../data/models/SupportTicket"; // <-- you'll need a SupportTicket model
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/support
 * User: Submit a new support ticket
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: "Subject and description are required" });
    }

    const ticket = new SupportTicket({
      user: req.user?.id,
      subject,
      description,
      priority: priority || "normal",
      status: "open",
      createdAt: new Date(),
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: "Support ticket submitted successfully",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit support ticket" });
  }
});

/**
 * GET /api/support/my
 * User: View own support tickets
 */
router.get("/my", authenticate, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user?.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

/**
 * GET /api/support
 * Admin/SuperAdmin: View all support tickets (with pagination)
 */
router.get("/", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const tickets = await SupportTicket.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SupportTicket.countDocuments();

    res.json({
      success: true,
      count: tickets.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      tickets,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

/**
 * PUT /api/support/:id/respond
 * Admin/SuperAdmin: Respond to a support ticket
 */
router.put("/:id/respond", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const { response } = req.body;
    if (!response) return res.status(400).json({ error: "Response is required" });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.response = response;
    ticket.status = "in-progress";
    ticket.respondedAt = new Date();
    await ticket.save();

    res.json({
      success: true,
      message: "Response added successfully",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to respond to ticket" });
  }
});

/**
 * PUT /api/support/:id/resolve
 * Admin/SuperAdmin: Mark a support ticket as resolved
 */
router.put("/:id/resolve", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.status = "resolved";
    ticket.resolvedAt = new Date();
    await ticket.save();

    res.json({
      success: true,
      message: "Ticket resolved successfully",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve ticket" });
  }
});

export default router;

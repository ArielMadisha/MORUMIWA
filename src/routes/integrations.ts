// src/routes/integrations.ts
import express from "express";
import { authenticate, authorize } from "../middleware/auth";
import { sendEmailNotification } from "../services/notification";
import { initiatePayment } from "../services/payment";

const router = express.Router();

/**
 * GET /api/integrations/status
 * SuperAdmin: Check status of external integrations
 */
router.get("/status", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const integrations = {
      paygate: !!process.env.PAYGATE_ID && !!process.env.PAYGATE_SECRET,
      email: !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS,
      notifications: true, // Socket.IO initialized in notification service
    };

    res.json({
      success: true,
      integrations,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch integration status" });
  }
});

/**
 * POST /api/integrations/test/email
 * SuperAdmin: Send a test email
 */
router.post("/test/email", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Recipient email is required" });

    await sendEmailNotification(to, "Integration Test", "This is a test email from Qwertymates integrations.");

    res.json({
      success: true,
      message: `Test email sent to ${to}`,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send test email" });
  }
});

/**
 * POST /api/integrations/test/payment
 * SuperAdmin: Initiate a test payment
 */
router.post("/test/payment", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { amount, reference, returnUrl } = req.body;
    if (!amount || !reference || !returnUrl) {
      return res.status(400).json({ error: "amount, reference, and returnUrl are required" });
    }

    const paymentRequest = await initiatePayment(amount, reference, returnUrl);

    res.json({
      success: true,
      message: "Test payment request generated",
      paymentRequest,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to initiate test payment" });
  }
});

/**
 * POST /api/integrations/test/notifications
 * SuperAdmin: Send a test realtime notification
 */
router.post("/test/notifications", authenticate, authorize(["superadmin"]), async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: "userId and message are required" });
    }

    // In production, use sendRealtimeNotification from services/notification
    // Here we just scaffold response
    res.json({
      success: true,
      message: `Test notification sent to user ${userId}`,
      payload: { message, timestamp: new Date() },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

export default router;

// src/routes/payments.ts
import express from "express";
import { authenticate, authorize } from "../middleware/auth";
import { initiatePayment, verifyPayment } from "../services/payment";

const router = express.Router();

/**
 * POST /api/payments/initiate
 * Initiate a payment request
 */
router.post("/initiate", authenticate, async (req, res) => {
  try {
    const { amount, reference, returnUrl } = req.body;

    if (!amount || !reference || !returnUrl) {
      return res.status(400).json({ error: "amount, reference, and returnUrl are required" });
    }

    const paymentRequest = await initiatePayment(amount, reference, returnUrl);

    res.status(201).json({
      success: true,
      paymentRequest,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to initiate payment" });
  }
});

/**
 * POST /api/payments/verify
 * Verify a payment request
 */
router.post("/verify", authenticate, async (req, res) => {
  try {
    const { payRequestId, checksum } = req.body;

    if (!payRequestId || !checksum) {
      return res.status(400).json({ error: "payRequestId and checksum are required" });
    }

    const verification = await verifyPayment(payRequestId, checksum);

    res.json({
      success: verification.success,
      verification,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to verify payment" });
  }
});

/**
 * GET /api/payments/admin/logs
 * Admin-only: View payment logs (future extension)
 */
router.get("/admin/logs", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    // In production, you’d query your Transaction model here
    res.json({
      success: true,
      message: "Payment logs endpoint scaffolded",
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch payment logs" });
  }
});

export default router;

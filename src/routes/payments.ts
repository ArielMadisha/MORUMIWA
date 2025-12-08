// src/routes/payments.ts
import express from "express";
import Payment from "../data/models/Payment";
import { authenticate, authorize } from "../middleware/auth";
import { initiatePayment, verifyPayment } from "../services/payment";

const router = express.Router();

/**
 * POST /api/payments/initiate
 * Client initiates payment for a task
 */
router.post("/initiate", authenticate, authorize(["client"]), async (req, res) => {
  try {
    const { taskId, amount } = req.body;
    const reference = `TASK-${taskId}-${Date.now()}`;
    const returnUrl = `${process.env.BASE_URL}/api/payments/verify`;

    const payload = await initiatePayment(amount, reference, returnUrl);

    const payment = new Payment({
      task: taskId,
      client: req.user?.id,
      amount,
      status: "pending",
    });
    await payment.save();

    res.json({ payment, payload });
  } catch (err) {
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

/**
 * POST /api/payments/verify
 * PayGate callback to verify payment
 */
router.post("/verify", async (req, res) => {
  try {
    const { PAY_REQUEST_ID, CHECKSUM } = req.body;
    const result = await verifyPayment(PAY_REQUEST_ID, CHECKSUM);

    const payment = await Payment.findOne({ transactionId: PAY_REQUEST_ID });
    if (payment) {
      payment.status = result.status;
      await payment.save();
    }

    res.json({ status: result.status });
  } catch (err) {
    res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;

// src/routes/reporting.ts
import express from "express";
import User from "../data/models/User";
import Task from "../data/models/Task";
import Payment from "../data/models/Payment";
import { authenticate, authorize } from "../middleware/auth";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

const router = express.Router();

/**
 * GET /api/reporting/users/csv
 * Export all users as CSV
 */
router.get("/users/csv", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    const parser = new Parser({ fields: ["name", "email", "role", "createdAt"] });
    const csv = parser.parse(users);

    res.header("Content-Type", "text/csv");
    res.attachment("users_report.csv");
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate CSV report" });
  }
});

/**
 * GET /api/reporting/tasks/pdf
 * Export tasks summary as PDF
 */
router.get("/tasks/pdf", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const tasks = await Task.find().populate("client runner", "name role");

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=tasks_report.pdf");

    doc.pipe(res);
    doc.fontSize(18).text("Tasks Report", { align: "center" });
    doc.moveDown();

    tasks.forEach((task) => {
      doc.fontSize(12).text(
        `Title: ${task.title}\nClient: ${task.client?.name}\nRunner: ${task.runner?.name || "N/A"}\nStatus: ${task.status}\nBudget: R${task.budget}\n---`
      );
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
});

/**
 * GET /api/reporting/revenue/csv
 * Export revenue data as CSV
 */
router.get("/revenue/csv", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const payments = await Payment.find({ status: "successful" });
    const parser = new Parser({ fields: ["task", "client", "runner", "amount", "createdAt"] });
    const csv = parser.parse(payments);

    res.header("Content-Type", "text/csv");
    res.attachment("revenue_report.csv");
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate revenue CSV report" });
  }
});

export default router;

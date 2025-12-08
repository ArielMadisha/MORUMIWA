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
router.get("/users/csv", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");

    if (!users.length) {
      return res.status(404).json({ success: false, error: "No users found" });
    }

    const parser = new Parser({ fields: ["name", "email", "role", "createdAt"] });
    const csv = parser.parse(users);

    res.header("Content-Type", "text/csv");
    res.attachment("users_report.csv");
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to generate CSV report" });
  }
});

/**
 * GET /api/reporting/tasks/pdf
 * Export tasks summary as PDF
 */
router.get("/tasks/pdf", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const tasks = await Task.find().populate("client runner", "name role");

    if (!tasks.length) {
      return res.status(404).json({ success: false, error: "No tasks found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=tasks_report.pdf");

    doc.pipe(res);
    doc.fontSize(18).text("Tasks Report", { align: "center" });
    doc.moveDown();

    tasks.forEach((task) => {
      doc.fontSize(12).text(
        `Title: ${task.title}
Client: ${task.client?.name}
Runner: ${task.runner?.name || "N/A"}
Status: ${task.status}
Budget: R${task.budget}
---`
      );
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to generate PDF report" });
  }
});

/**
 * GET /api/reporting/revenue/csv
 * Export revenue data as CSV
 */
router.get("/revenue/csv", authenticate, authorize(["admin", "superadmin"]), async (req, res) => {
  try {
    const payments = await Payment.find({ status: "successful" })
      .populate("task", "title")
      .populate("client", "name")
      .populate("runner", "name");

    if (!payments.length) {
      return res.status(404).json({ success: false, error: "No revenue records found" });
    }

    const parser = new Parser({
      fields: ["task.title", "client.name", "runner.name", "amount", "createdAt"],
    });
    const csv = parser.parse(payments);

    res.header("Content-Type", "text/csv");
    res.attachment("revenue_report.csv");
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to generate revenue CSV report" });
  }
});

export default router;


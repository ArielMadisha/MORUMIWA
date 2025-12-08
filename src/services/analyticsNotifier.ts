// src/services/analyticsNotifier.ts
import { sendRealtimeNotification, sendEmailNotification } from "./notification";
import Task from "../data/models/Task";
import Payment from "../data/models/Payment";

export const checkAnalyticsThresholds = async () => {
  // Weekly tasks alert
  const weeklyTasks = await Task.aggregate([
    {
      $group: {
        _id: { $isoWeek: "$createdAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 1 },
  ]);

  if (weeklyTasks[0]?.count < 10) {
    sendRealtimeNotification("admin", "lowTasks", { message: "Weekly tasks below threshold" });
    await sendEmailNotification(
      process.env.ADMIN_EMAIL || "",
      "Low Weekly Tasks Alert",
      "Weekly tasks have dropped below 10."
    );
  }

  // Monthly revenue alert
  const monthlyRevenue = await Payment.aggregate([
    { $match: { status: "successful" } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 1 },
  ]);

  if (monthlyRevenue[0]?.total < 5000) {
    sendRealtimeNotification("admin", "lowRevenue", { message: "Monthly revenue below R5000" });
    await sendEmailNotification(
      process.env.ADMIN_EMAIL || "",
      "Low Revenue Alert",
      "Monthly revenue has dropped below R5000."
    );
  }

  // Daily tasks alert
  const dailyTasks = await Task.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 1 },
  ]);

  if (dailyTasks[0]?.count < 5) {
    sendRealtimeNotification("admin", "lowDailyTasks", { message: "Less than 5 tasks today" });
    await sendEmailNotification(
      process.env.ADMIN_EMAIL || "",
      "Low Daily Tasks Alert",
      "Task creation has dropped below 5 today."
    );
  }

  // Weekly revenue alert
  const weeklyRevenue = await Payment.aggregate([
    { $match: { status: "successful" } },
    {
      $group: {
        _id: { $isoWeek: "$createdAt" },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 1 },
  ]);

  if (weeklyRevenue[0]?.total < 10000) {
    sendRealtimeNotification("admin", "lowWeeklyRevenue", { message: "Weekly revenue below R10,000" });
    await sendEmailNotification(
      process.env.ADMIN_EMAIL || "",
      "Low Weekly Revenue Alert",
      "Weekly revenue has dropped below R10,000
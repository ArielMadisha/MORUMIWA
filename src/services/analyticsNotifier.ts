// src/services/analyticsNotifier.ts
import { sendRealtimeNotification, sendEmailNotification } from "./notification";
import Task from "../data/models/Task";
import Payment from "../data/models/Payment";

const THRESHOLDS = {
  weeklyTasks: 10,
  monthlyRevenue: 5000,
  dailyTasks: 5,
  weeklyRevenue: 10000,
};

export const checkAnalyticsThresholds = async () => {
  try {
    // Weekly tasks alert
    const weeklyTasks = await Task.aggregate([
      { $group: { _id: { $isoWeek: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 1 },
    ]);

    if (weeklyTasks[0]?.count < THRESHOLDS.weeklyTasks) {
      sendRealtimeNotification("admin", "lowTasks", {
        message: `Weekly tasks below threshold (${weeklyTasks[0]?.count})`,
      });
      if (process.env.ADMIN_EMAIL) {
        await sendEmailNotification(
          process.env.ADMIN_EMAIL,
          "Low Weekly Tasks Alert",
          `Weekly tasks have dropped below ${THRESHOLDS.weeklyTasks}. Current: ${weeklyTasks[0]?.count}`
        );
      }
    }

    // Monthly revenue alert
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: "successful" } },
      { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$amount" } } },
      { $sort: { _id: -1 } },
      { $limit: 1 },
    ]);

    if (monthlyRevenue[0]?.total < THRESHOLDS.monthlyRevenue) {
      sendRealtimeNotification("admin", "lowRevenue", {
        message: `Monthly revenue below R${THRESHOLDS.monthlyRevenue}`,
      });
      if (process.env.ADMIN_EMAIL) {
        await sendEmailNotification(
          process.env.ADMIN_EMAIL,
          "Low Revenue Alert",
          `Monthly revenue has dropped below R${THRESHOLDS.monthlyRevenue}. Current: R${monthlyRevenue[0]?.total}`
        );
      }
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

    if (dailyTasks[0]?.count < THRESHOLDS.dailyTasks) {
      sendRealtimeNotification("admin", "lowDailyTasks", {
        message: `Daily tasks below threshold (${dailyTasks[0]?.count})`,
      });
      if (process.env.ADMIN_EMAIL) {
        await sendEmailNotification(
          process.env.ADMIN_EMAIL,
          "Low Daily Tasks Alert",
          `Task creation has dropped below ${THRESHOLDS.dailyTasks} today. Current: ${dailyTasks[0]?.count}`
        );
      }
    }

    // Weekly revenue alert
    const weeklyRevenue = await Payment.aggregate([
      { $match: { status: "successful" } },
      { $group: { _id: { $isoWeek: "$createdAt" }, total: { $sum: "$amount" } } },
      { $sort: { _id: -1 } },
      { $limit: 1 },
    ]);

    if (weeklyRevenue[0]?.total < THRESHOLDS.weeklyRevenue) {
      sendRealtimeNotification("admin", "lowWeeklyRevenue", {
        message: `Weekly revenue below R${THRESHOLDS.weeklyRevenue}`,
      });
      if (process.env.ADMIN_EMAIL) {
        await sendEmailNotification(
          process.env.ADMIN_EMAIL,
          "Low Weekly Revenue Alert",
          `Weekly revenue has dropped below R${THRESHOLDS.weeklyRevenue}. Current: R${weeklyRevenue[0]?.total}`
        );
      }
    }
  } catch (err) {
    console.error("❌ Analytics threshold check failed:", err);
  }
};

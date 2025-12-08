// src/services/analytics.ts
import Task from "../data/models/Task";
import Transaction from "../data/models/Transaction";
import User from "../data/models/User";

/**
 * Get total tasks posted, accepted, completed, cancelled
 */
export const getTaskStats = async () => {
  const posted = await Task.countDocuments({ status: "posted" });
  const accepted = await Task.countDocuments({ status: "accepted" });
  const completed = await Task.countDocuments({ status: "completed" });
  const cancelled = await Task.countDocuments({ status: "cancelled" });

  return { posted, accepted, completed, cancelled };
};

/**
 * Get revenue stats (sum of payments)
 */
export const getRevenueStats = async () => {
  const payments = await Transaction.aggregate([
    { $match: { type: "payment" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return { totalRevenue: payments[0]?.total || 0 };
};

/**
 * Get user stats (clients vs runners)
 */
export const getUserStats = async () => {
  const clients = await User.countDocuments({ role: "client" });
  const runners = await User.countDocuments({ role: "runner" });
  const admins = await User.countDocuments({ role: "admin" });

  return { clients, runners, admins };
};

/**
 * Get platform KPIs
 */
export const getPlatformKPIs = async () => {
  const tasks = await getTaskStats();
  const revenue = await getRevenueStats();
  const users = await getUserStats();

  return {
    tasks,
    revenue,
    users,
  };
};

// src/services/matching.ts
import Task from "../data/models/Task";
import Review from "../data/models/Review";
import User from "../data/models/User";

export const findBestRunner = async (taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  // Get all runners
  const runners = await User.find({ role: "runner" });

  // Score runners
  const scoredRunners = await Promise.all(
    runners.map(async (runner) => {
      // Average rating
      const reviews = await Review.find({ reviewee: runner._id });
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      // Active tasks
      const activeTasks = await Task.countDocuments({
        runner: runner._id,
        status: "accepted",
      });

      // Distance (simple Euclidean for now)
      const [lng, lat] = task.location.coordinates;
      const [runnerLng, runnerLat] = [0, 0]; // TODO: store runner location
      const distance = Math.sqrt(
        Math.pow(lng - runnerLng, 2) + Math.pow(lat - runnerLat, 2)
      );

      // Composite score: higher rating, fewer active tasks, closer distance
      const score = avgRating * 2 - activeTasks - distance;
      return { runner, score };
    })
  );

  // Pick best runner
  scoredRunners.sort((a, b) => b.score - a.score);
  return scoredRunners[0]?.runner;
};

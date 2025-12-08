// src/models/db.ts
import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/qwertymates";

    await mongoose.connect(mongoUri, {
      // optional settings for stability
      autoIndex: true,
      maxPoolSize: 10,
    });

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1); // exit process if DB connection fails
  }
};

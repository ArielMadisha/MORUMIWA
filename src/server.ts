import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import errorHandler from './middleware/errorHandler'; // if you used default export
import userRoutes from "./routes/users";
import reviewRoutes from "./routes/reviews";
import taskRoutes from "./routes/tasks";
import paymentRoutes from "./routes/payments";
import { initNotificationService } from "./services/notification";
import notificationRoutes from "./routes/notifications";
import walletRoutes from "./routes/wallet";
import messengerRoutes from "./routes/messenger";
import { initChatService } from "./services/chat";
import adminRoutes from "./routes/admin";
import analyticsRoutes from "./routes/analytics";
import { checkAnalyticsThresholds } from "./services/analyticsNotifier";
import reportingRoutes from "./routes/reporting";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/messenger", messengerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reporting", reportingRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// DB Connection
mongoose.connect(process.env.MONGO_URI || "")
  .then(() => {
    console.log("MongoDB connected");

    const server = app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );

    initNotificationService(server);
    initChatService(server);

    // Run analytics checks every hour
    setInterval(checkAnalyticsThresholds, 60 * 60 * 1000);
  })
  .catch((err) => console.error("DB connection error:", err));

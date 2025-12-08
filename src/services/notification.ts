// src/services/notification.ts
import nodemailer from "nodemailer";
import { Server } from "socket.io";

let io: Server | null = null;

/**
 * Initialize notification service with Socket.IO
 */
export const initNotificationService = (server: any) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("🔔 Notification client connected:", socket.id);
  });
};

/**
 * Send realtime notification
 * @param target "all" | role string | userId
 * @param type notification type
 * @param payload notification data
 */
export const sendRealtimeNotification = (
  target: "all" | string,
  type: string,
  payload: any
) => {
  if (!io) {
    console.error("Notification service not initialized");
    return;
  }

  const message = { type, payload, timestamp: new Date() };

  if (target === "all") {
    io.emit("notification", message);
  } else {
    io.to(target).emit("notification", message);
  }
};

/**
 * Send email notification
 */
export const sendEmailNotification = async (
  to: string,
  subject: string,
  text: string
) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("Email transport not configured");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@qwertymates.com",
      to,
      subject,
      text,
    });

    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("Failed to send email notification:", err);
  }
};

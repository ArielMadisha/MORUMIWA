// src/services/notification.ts
import { Server } from "socket.io";
import nodemailer from "nodemailer";

let io: Server;

export const initNotificationService = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: { origin: "*" },
    path: "/notifications", // namespace for notifications
  });

  io.on("connection", (socket) => {
    console.log("Notification client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Notification client disconnected:", socket.id);
    });
  });
};

// Emit a real-time notification
export const sendRealtimeNotification = (
  userId: string,
  event: string,
  payload: any
) => {
  if (!io) return;
  io.to(userId).emit(event, payload);
};

// Example email notification
export const sendEmailNotification = async (
  to: string,
  subject: string,
  text: string
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or SendGrid/Twilio
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

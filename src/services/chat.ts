// src/services/chat.ts
import { Server } from "socket.io";
import Message from "../data/models/Message";

let io: Server;

export const initChatService = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: { origin: "*" },
    path: "/chat", // namespace for chat
  });

  io.on("connection", (socket) => {
    console.log("💬 Chat client connected:", socket.id);

    // Join a room for a specific task
    socket.on("joinTask", (taskId: string) => {
      if (!taskId) return;
      socket.join(taskId);
      console.log(`Socket ${socket.id} joined task room ${taskId}`);
    });

    // Send a message
    socket.on("sendMessage", async (data) => {
      try {
        const { taskId, senderId, receiverId, content } = data;
        if (!taskId || !senderId || !receiverId || !content) return;

        const message = new Message({
          task: taskId,
          sender: senderId,
          receiver: receiverId,
          content,
          createdAt: new Date(),
          read: false,
        });
        await message.save();

        const payload = {
          id: message._id,
          taskId,
          senderId,
          receiverId,
          content,
          createdAt: message.createdAt,
          read: message.read,
        };

        // Emit to everyone in the task room
        io.to(taskId).emit("newMessage", payload);
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      const { taskId, senderId } = data;
      if (!taskId || !senderId) return;
      io.to(taskId).emit("userTyping", { senderId, timestamp: new Date() });
    });

    // Read receipt
    socket.on("readMessage", async (data) => {
      try {
        const { messageId, readerId, taskId } = data;
        if (!messageId || !readerId || !taskId) return;

        const message = await Message.findById(messageId);
        if (message) {
          message.read = true;
          message.readAt = new Date();
          await message.save();

          io.to(taskId).emit("messageRead", {
            messageId,
            readerId,
            readAt: message.readAt,
          });
        }
      } catch (err) {
        console.error("Error marking message as read:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Chat client disconnected:", socket.id);
    });
  });
};

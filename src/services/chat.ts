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
    console.log("Chat client connected:", socket.id);

    // Join a room for a specific task
    socket.on("joinTask", (taskId: string) => {
      socket.join(taskId);
      console.log(`Socket ${socket.id} joined task room ${taskId}`);
    });

    // Send a message
    socket.on("sendMessage", async (data) => {
      const { taskId, senderId, receiverId, content } = data;

      const message = new Message({
        task: taskId,
        sender: senderId,
        receiver: receiverId,
        content,
      });
      await message.save();

      // Emit to everyone in the task room
      io.to(taskId).emit("newMessage", message);
    });

    // Typing indicator
    socket.on("typing", (data) => {
      const { taskId, senderId } = data;
      io.to(taskId).emit("userTyping", { senderId });
    });

    // Read receipt
    socket.on("readMessage", async (data) => {
      const { messageId, readerId, taskId } = data;
      const message = await Message.findById(messageId);
      if (message) {
        message.read = true;
        await message.save();
        io.to(taskId).emit("messageRead", { messageId, readerId });
      }
    });

    socket.on("disconnect", () => {
      console.log("Chat client disconnected:", socket.id);
    });
  });
};

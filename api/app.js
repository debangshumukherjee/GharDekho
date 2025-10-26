import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoute from "./routes/auth.route.js";
import postRoute from "./routes/post.route.js";
import testRoute from "./routes/test.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

let onlineUser = [];

const addUser = (userId, socketId) => {
  const userExits = onlineUser.find((user) => user.userId === userId);
  if (!userExits) {
    onlineUser.push({ userId, socketId });
  }
};

const removeUser = (socketId) => {
  onlineUser = onlineUser.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUser.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  socket.on("newUser", (userId) => {
    addUser(userId, socket.id);
  });

  socket.on("joinChatRoom", (chatId) => {
    socket.join(chatId);
  });

  socket.on("leaveChatRoom", (chatId) => {
    socket.leave(chatId);
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      socket.broadcast.to(data.chatId).emit("getMessage", data);
      io.to(receiver.socketId).emit("updateChatList", data);
    }
  });

  socket.on(
    "deleteMessages",
    ({ receiverId, chatId, messageIds, newLastMessage }) => {
      const receiver = getUser(receiverId);
      if (receiver) {
        io.to(receiver.socketId).emit("messagesSoftDeleted", {
          chatId,
          messageIds,
          newLastMessage,
        });
      }
    }
  );

  socket.on("logout", () => {
    removeUser(socket.id);
    socket.disconnect();
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
  });
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Middleware to pass io and onlineUser to controllers
app.use((req, res, next) => {
  req.io = io;
  req.onlineUser = onlineUser;
  req.getUser = getUser;
  next();
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/test", testRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

server.listen(8800, () => {
  console.log("Server is running!");
});

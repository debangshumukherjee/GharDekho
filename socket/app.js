import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: "http://localhost:5173",
  },
});

let onlineUser = [];

const addUser = (userId, socketId) => {
  const userExits = onlineUser.find((user) => user.userId === userId);
  if (!userExits) {
    onlineUser.push({ userId, socketId });
    // console.log(`User added: ${userId} with socket ID: ${socketId}`); // Debugging log
  }
};

const removeUser = (socketId) => {
  onlineUser = onlineUser.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  // console.log("Searching for user with ID:", userId);
  return onlineUser.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  // console.log("New user connected:", socket.id);

  socket.on("newUser", (userId) => {
    // console.log(`Adding new user: ${userId} with socket ID: ${socket.id}`);
    addUser(userId, socket.id);
  });

  socket.on("logout", () => {
    console.log("User logged out, disconnecting socket:", socket.id);
    removeUser(socket.id); // Remove the user from the onlineUser list
    socket.disconnect(); // Optionally disconnect the socket connection here
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    const receiver = getUser(receiverId);
    // io.to(receiver.socketId).emit("getMessage", data);
    if (receiver) {
      // console.log(
      //   `Receiver found: ${receiverId} with socket ID: ${receiver.socketId}`
      // );
      io.to(receiver.socketId).emit("getMessage", data);
      // console.log(data);
    } else {
      console.log(`Receiver with ID ${receiverId} not found.`);
    }
  });

  socket.on("disconnect", () => {
    // removeUser(socket.id);
    console.log("User disconnected:", socket.id);
  });
});

io.listen("4000");

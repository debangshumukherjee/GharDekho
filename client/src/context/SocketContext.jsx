import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import { useChatStore } from "../lib/chatStore";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  // Get all necessary actions from our global store
  const {
    setChats,
    addChat,
    updateChat,
    handleNewNotification,
    currentOpenChatId,
    setCurrentUser,
  } = useChatStore();

  useEffect(() => {
    // This establishes the connection once
    const newSocket = io("http://localhost:8800");
    setSocket(newSocket);

    // This runs when the component unmounts, ensuring a clean disconnection
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Pass the current user to the store whenever it changes
    setCurrentUser(currentUser);
  }, [currentUser, setCurrentUser]);

  useEffect(() => {
    if (socket && currentUser) {
      // Identify the user to the server
      socket.emit("newUser", currentUser.id);

      // --- ALL GLOBAL LISTENERS ARE DEFINED HERE ---

      // Listens for a new incoming message (direct delivery)
      const messageHandler = (data) => {
        // This will update the chat list, moving the chat to the top
        updateChat(data.chatId, data.text, false); // `false` because receiver hasn't seen it
      };

      // Listens for a server-side update to the chat list (also emitted when receiver is offline)
      const updateChatListHandler = (data) => {
        // If the chat is currently open, just update the chat in list and do not increment notifications
        if (currentOpenChatId === data.chatId) {
          updateChat(data.chatId, data.text, false);
        } else {
          // Chat not open — increment per-chat unread and update list
          updateChat(data.chatId, data.text, false);
          handleNewNotification(data.chatId);
        }
      };

      const newChatHandler = (data) => {
        addChat(data);
      };

      // Listens for a notification event (legacy / alternate channel)
      const notificationHandler = ({ chatId }) => {
        // Only increment if chat isn't open
        if (currentOpenChatId !== chatId) handleNewNotification(chatId);
      };

      // Listens for when messages are deleted by the other user
      const deleteHandler = ({ chatId, newLastMessage }) => {
        updateChat(chatId, newLastMessage, false);
      };

      // Attach the listeners
      socket.on("getMessage", messageHandler);
      socket.on("updateChatList", updateChatListHandler);
      socket.on("newChat", newChatHandler);
      socket.on("getNotification", notificationHandler);
      socket.on("messagesSoftDeleted", deleteHandler);

      // Cleanup: Remove listeners when user logs out or socket changes
      return () => {
        socket.off("getMessage", messageHandler);
        socket.off("updateChatList", updateChatListHandler);
        socket.off("newChat", newChatHandler);
        socket.off("getNotification", notificationHandler);
        socket.off("messagesSoftDeleted", deleteHandler);
      };
    }
  }, [
    socket,
    currentUser,
    updateChat,
    addChat,
    handleNewNotification,
    currentOpenChatId,
  ]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

import { create } from "zustand";
import apiRequest from "./apiRequest";

export const useChatStore = create((set, get) => ({
  chats: [],
  currentUser: null,
  currentOpenChatId: null,
  isLoading: true,
  error: null,
  number: 0,

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  setOpenChatId: (chatId) => {
    set({ currentOpenChatId: chatId });
  },

  clearOpenChatId: () => {
    set({ currentOpenChatId: null });
  },

  fetchChats: async () => {
    if (get().isLoading === false && get().chats.length > 0) return;
    try {
      set({ isLoading: true, error: null });
      const res = await apiRequest("/chats");
      const chats = res.data;

      let unreadCount = 0;
      const currentUser = get().currentUser;
      if (currentUser) {
        chats.forEach((chat) => {
          // Initialize per-chat unreadCount (server might not provide this)
          if (typeof chat.unreadCount === "undefined") chat.unreadCount = 0;
          if (!chat.seenBy.includes(currentUser.id)) {
            // If the current user hasn't seen the chat, count all unread messages for that chat
            // If server doesn't provide unreadCount, treat as 1 unread chat
            unreadCount += chat.unreadCount > 0 ? chat.unreadCount : 1;
          }
        });
      }
      set({ chats: chats, number: unreadCount, isLoading: false });
    } catch (err) {
      console.log(err);
      set({ isLoading: false, error: err });
    }
  },

  addChat: (chat) => {
    set((state) => {
      const chatExists = state.chats.some((c) => c.id === chat.id);
      if (chatExists) {
        return {};
      }
      return { chats: [chat, ...state.chats], number: state.number + 1 };
    });
  },

  updateChat: (chatId, lastMessage, isSender) => {
    set((state) => {
      const chatIndex = state.chats.findIndex((c) => c.id === chatId);

      // If chat is new, do nothing, it will be handled by newChat event
      if (chatIndex === -1) {
        return {};
      }

      const updatedChats = [...state.chats];
      const chatToUpdate = { ...updatedChats[chatIndex] };

      chatToUpdate.lastMessage = lastMessage;
      // If the current user is the sender, mark it as seen by them.
      // If they are the receiver, mark it as unseen.
      chatToUpdate.seenBy = isSender ? [state.currentUser.id] : [];

      updatedChats.splice(chatIndex, 1);
      updatedChats.unshift(chatToUpdate);

      return { chats: updatedChats };
    });
  },

  handleNewNotification: (chatId) => {
    set((state) => {
      const chatsCopy = [...state.chats];
      const idx = chatsCopy.findIndex((c) => c.id === chatId);
      // If chat exists in store, increment its unreadCount regardless of seenBy
      if (idx !== -1) {
        const chat = { ...chatsCopy[idx] };
        if (typeof chat.unreadCount === "undefined") chat.unreadCount = 0;
        chat.unreadCount = chat.unreadCount + 1;
        // Ensure seenBy does not include current user while unread
        chat.seenBy = chat.seenBy.filter((id) => id !== state.currentUser?.id);
        chatsCopy[idx] = chat;
        return { chats: chatsCopy, number: state.number + 1 };
      }
      // If chat isn't in the list yet, just increment the global number
      return { number: state.number + 1 };
    });
  },

  markAsRead: (chatId) => {
    set((state) => {
      const chatIndex = state.chats.findIndex((c) => c.id === chatId);
      if (chatIndex === -1) return {};

      const chat = state.chats[chatIndex];
      const wasUnread =
        !chat.seenBy.includes(state.currentUser?.id) ||
        (chat.unreadCount && chat.unreadCount > 0);

      if (wasUnread) {
        const updatedChats = [...state.chats];
        const updatedChat = { ...updatedChats[chatIndex] };
        // mark as seen and reset per-chat unread count
        updatedChat.seenBy = Array.from(
          new Set([...(chat.seenBy || []), state.currentUser.id])
        );
        updatedChat.unreadCount = 0;
        updatedChats[chatIndex] = updatedChat;

        // Recalculate global number as sum of unreadCount across chats
        const totalUnread = updatedChats.reduce(
          (acc, c) => acc + (c.unreadCount || 0),
          0
        );

        return {
          chats: updatedChats,
          number: totalUnread,
        };
      }
      return {};
    });
  },
}));

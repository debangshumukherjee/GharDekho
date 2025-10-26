import { useContext, useEffect, useRef, useState } from "react";
import "./chat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { SocketContext } from "../../context/SocketContext";
import { useChatStore } from "../../lib/chatStore";
import { formatTimestamp } from "../../lib/formatters";

function Chat() {
  const [chat, setChat] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [isLoading, setIsLoading] = useState(false);
  const { chats, markAsRead, updateChat } = useChatStore();
  const { setOpenChatId, clearOpenChatId } = useChatStore();

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  const messageEndRef = useRef();
  const textareaRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  const handleOpenChat = async (id, receiver) => {
    setIsDeleteMode(false);
    setSelectedMessages(new Set());

    if (socket && chat && chat.id !== id) {
      socket.emit("leaveChatRoom", chat.id);
    }
    try {
      const res = await apiRequest(`/chats/${id}`);
      markAsRead(id);
      setChat({ ...res.data, receiver });
      // inform global store which chat is open
      setOpenChatId(id);
      if (socket) {
        socket.emit("joinChatRoom", id);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleCloseChat = () => {
    if (socket && chat) {
      socket.emit("leaveChatRoom", chat.id);
    }
    setChat(null);
    setIsDeleteMode(false);
    setSelectedMessages(new Set());
    // clear open chat id in global store
    clearOpenChatId();
  };

  useEffect(() => {
    if (chat && !isDeleteMode) {
      textareaRef.current?.focus();
    }
  }, [chat, isDeleteMode]);

  useEffect(() => {
    if (socket) {
      const messageHandler = (data) => {
        if (chat?.id === data.chatId) {
          setChat((prev) => ({ ...prev, messages: [...prev.messages, data] }));
          markAsRead(data.chatId);
        }
      };

      const deleteHandler = ({ chatId, messageIds, newLastMessage }) => {
        updateChat(chatId, newLastMessage);

        if (chat?.id === chatId) {
          setChat((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              messageIds.includes(msg.id)
                ? { ...msg, text: "This message was deleted" }
                : msg
            ),
          }));
        }
      };

      socket.on("getMessage", messageHandler);
      socket.on("messagesSoftDeleted", deleteHandler);

      return () => {
        socket.off("getMessage", messageHandler);
        socket.off("messagesSoftDeleted", deleteHandler);
      };
    }
  }, [socket, chat, markAsRead, updateChat]);

  const toggleDeleteMode = () => {
    setIsDeleteMode((prev) => !prev);
    setSelectedMessages(new Set());
  };

  const handleSelectMessage = (messageId) => {
    setSelectedMessages((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(messageId)) {
        newSelection.delete(messageId);
      } else {
        newSelection.add(messageId);
      }
      return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.size === 0) return;
    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${selectedMessages.size} message(s)?`
    );

    if (isConfirmed) {
      setIsLoading(true);
      const messageIdsToDelete = Array.from(selectedMessages);
      try {
        const res = await apiRequest.put("/messages/soft-delete", {
          messageIds: messageIdsToDelete,
        });

        const { newLastMessage } = res.data;

        setChat((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            messageIdsToDelete.includes(msg.id)
              ? { ...msg, text: "This message was deleted" }
              : msg
          ),
        }));

        updateChat(chat.id, newLastMessage);

        socket.emit("deleteMessages", {
          receiverId: chat.receiver.id,
          chatId: chat.id,
          messageIds: messageIdsToDelete,
          newLastMessage: newLastMessage,
        });

        toggleDeleteMode();
      } catch (err) {
        console.error("Failed to delete messages:", err);
        alert("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDeleteMode) return;
    setIsLoading(true);
    const formData = new FormData(e.target);
    const text = formData.get("text");

    if (!text) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiRequest.post(`/messages/${chat.id}`, { text });
      // Update the open chat window
      setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));
      e.target.reset();

      // --- THIS IS THE FIX ---
      // Update the sender's own chat list in the global store
      updateChat(chat.id, text, true);

      // Notify the receiver
      socket.emit("sendMessage", {
        receiverId: chat.receiver.id,
        data: res.data,
      });

      textareaRef.current?.focus();
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isLoading && formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  };

  return (
    <div className="chat">
      <div className="messages">
        <h1>Messages</h1>
        {chats?.length > 0 ? (
          chats.map((c) => (
            <div
              className="message"
              key={c.id}
              style={{
                backgroundColor: c.seenBy.includes(currentUser.id)
                  ? "white"
                  : "#fecd514e",
              }}
              onClick={() => handleOpenChat(c.id, c.receiver)}
            >
              <img src={c.receiver?.avatar || "/noavatar.jpg"} alt="" />
              <div className="contents">
                <span>
                  {`${c.receiver?.firstname || ""} ${
                    c.receiver?.middlename || ""
                  } ${c.receiver?.lastname || ""}`.trim()}
                </span>
                <p>
                  {c.lastMessage && c.lastMessage.length > 25
                    ? `${c.lastMessage.slice(0, 22)}...`
                    : c.lastMessage || "..."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>Your inbox is empty.</p>
        )}
      </div>
      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="userbar">
              <img src={chat.receiver?.avatar || "/noavatar.jpg"} alt="" />
              <span>
                {`${chat.receiver?.firstname || ""} ${
                  chat.receiver?.middlename || ""
                } ${chat.receiver?.lastname || ""}`.trim()}
              </span>
            </div>
            <div className="actions">
              <button
                onClick={toggleDeleteMode}
                className="action-btn"
                title="Delete Messages"
              >
                <img src="/delete.png" alt="Delete" />
              </button>
              <span className="close" onClick={handleCloseChat}>
                X
              </span>
            </div>
          </div>
          <div className={`center ${isDeleteMode ? "delete-mode" : ""}`}>
            {chat.messages.map((message) => {
              const isOwn = message.userId === currentUser.id;
              const isDeleted = message.text === "This message was deleted";
              return (
                <div
                  key={message.id}
                  className={`message-container ${isOwn ? "own" : "other"}`}
                >
                  {isDeleteMode && isOwn && !isDeleted && (
                    <input
                      type="checkbox"
                      className="message-checkbox"
                      checked={selectedMessages.has(message.id)}
                      onChange={() => handleSelectMessage(message.id)}
                    />
                  )}
                  <div className={`chatMessage ${isOwn ? "own" : "other"}`}>
                    <p className={isDeleted ? "deletedText" : ""}>
                      {message.text}
                    </p>
                    <span>{formatTimestamp(message.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef}></div>
          </div>
          {isDeleteMode ? (
            <div className="delete-actions-footer">
              <button
                onClick={handleDeleteSelected}
                disabled={isLoading || selectedMessages.size === 0}
              >
                Delete ({selectedMessages.size})
              </button>
              <button onClick={toggleDeleteMode}>Cancel</button>
            </div>
          ) : (
            <div className="bottom">
              <form ref={formRef} onSubmit={handleSubmit}>
                <textarea
                  ref={textareaRef}
                  onKeyDown={handleKeyDown}
                  name="text"
                  placeholder="Type a message..."
                ></textarea>
                <button disabled={isLoading}>Send</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;

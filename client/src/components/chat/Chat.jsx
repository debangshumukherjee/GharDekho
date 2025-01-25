import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./chat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { format } from "timeago.js";
import { SocketContext } from "../../context/SocketContext";
import { useNotificationStore } from "../../lib/notificationStore";

function Chat({ chats, onDeleteChat }) {
  const [chat, setChat] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const messageEndRef = useRef();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const decrease = useNotificationStore((state) => state.decrease);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleOpenChat = async (id, receiver) => {
    try {
      const res = await apiRequest(`/chats/${id}`);
      if (!res.data.seenBy.includes(currentUser.id)) {
        decrease();
      }

      setChat({ ...res.data, receiver });
      setActiveChatId(id);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const read = async () => {
      try {
        await apiRequest.put(`/chats/read/${chat.id}`);
      } catch (err) {
        console.log(err);
      }
    };

    if (chat && socket) {
      socket.on("getMessage", (data) => {
        if (chat.id === data.chatId) {
          setChat((prev) => ({ ...prev, messages: [...prev.messages, data] }));
          read();
        }
      });
    }
    return () => {
      socket.off("getMessage");
    };
  }, [socket, chat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const text = formData.get("text");

    if (!text) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiRequest.post(`/messages/${chat.id}`, { text });

      setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));

      e.target.reset();
      socket.emit("sendMessage", {
        receiverId: chat.receiver.id,
        data: res.data,
      });
      setIsLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteChat = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?"
    );
    if (confirmed) {
      try {
        await apiRequest.delete(`/chats/${chat.id}`); // Use chat.id instead of id

        // Clear the current chat and active chat ID
        setChat(null);
        setActiveChatId(null);
        navigate("/profile");
      } catch (err) {
        console.log("Error deleting chat:", err);
      }
    }
  };

  return (
    <div className="chat">
      <div className="messages">
        <h1>Messages</h1>
        {chats?.length > 0 ? (
          chats?.map((c) => (
            <div
              className="message"
              key={c.id}
              style={{
                backgroundColor:
                  c.seenBy.includes(currentUser.id) || activeChatId === c.id
                    ? "white"
                    : "#fecd514e",
              }}
              onClick={() => handleOpenChat(c.id, c.receiver)}
            >
              <img src={c.receiver.avatar || "/noavatar.jpg"} alt="" />
              <div className="contents">
                {/* <span>{c.receiver.firstname.length>25?`${c.receiver.firstname.slice(0, 22)}...`
                  : c.receiver.firstname }</span> */}
                {/* <span>{c.receiver.username}</span> */}
                {/* <span>
                {c.receiver.firstname.length > 25
                  ? `${c.receiver.firstname.slice(0, 22)}...`
                  : c.receiver.firstname}
                {c.receiver.middlename && c.receiver.middlename !== ""
                  ? ` ${c.receiver.middlename}`
                  : ""}
                {c.receiver.lastname && c.receiver.lastname !== ""
                  ? ` ${c.receiver.lastname}`
                  : ""}
              </span> */}
                <span>
                  {(() => {
                    // Combine firstname, middlename, and lastname
                    const fullName = `${c.receiver.firstname} ${
                      c.receiver.middlename || ""
                    } ${c.receiver.lastname || ""}`.trim();

                    // Truncate the full name if it exceeds 25 characters
                    return fullName.length > 25
                      ? `${fullName.slice(0, 22)}...` // Keep first 22 characters and add "..."
                      : fullName;
                  })()}
                </span>

                <p>
                  {c.lastMessage
                    ? c.lastMessage.length > 25
                      ? `${c.lastMessage.slice(0, 22)}...`
                      : c.lastMessage
                    : ""}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>Your inbox is empty.</p> // Display a message when there are no chats
        )}
      </div>
      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="userbar">
              <img src={chat.receiver.avatar || "noavatar.jpg"} alt="" />
              {/* {chat.receiver.username} */}
              <span>
                {chat.receiver.firstname}
                {chat.receiver.middlename && chat.receiver.middlename !== ""
                  ? ` ${chat.receiver.middlename}`
                  : ""}
                {chat.receiver.lastname && chat.receiver.lastname !== ""
                  ? ` ${chat.receiver.lastname}`
                  : ""}
              </span>
            </div>
            {/* <button className="deleteChatButton" onClick={handleDeleteChat}>
              Delete Chat
            </button> */}
            <span className="close" onClick={() => setChat(null)}>
              X
            </span>
          </div>
          <div className="center">
            {chat.messages.map((message) => (
              <div
                className={`chatMessage ${
                  message.userId === currentUser.id ? "own" : "other"
                }`}
                key={message.id}
              >
                <p>{message.text}</p>
                <span>[{format(message.createdAt)}]</span>
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>
          <form onSubmit={handleSubmit} className="bottom">
            <textarea name="text"></textarea>
            <button disabled={isLoading}>Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chat;

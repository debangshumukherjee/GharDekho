import Chat from "../../components/chat/Chat";
import List from "../../components/list/List";
import "./profilePage.scss";
import apiRequest from "../../lib/apiRequest";
import { Await, Link, useLoaderData, useNavigate } from "react-router-dom";
import { Suspense, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useChatStore } from "../../lib/chatStore"; // Import the global store

function ProfilePage() {
  const data = useLoaderData();
  const { updateUser, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Get the chat list directly from the global store instead of the loader
  const { chats } = useChatStore();

  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      updateUser(null);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="profilePage">
      <div className="details">
        <div className="wrapper">
          <div className="title">
            <h1>User Information</h1>
            <Link to="/profile/update">
              <button>
                <p>Update Profile</p>
              </button>
            </Link>
          </div>
          <div className="info">
            <span>
              Avatar:
              <img src={currentUser.avatar || "noavatar.jpg"} alt="" />
            </span>
            <span>
              Username: <b>{currentUser.username}</b>
            </span>
            <span>
              Full Name:{" "}
              <b>
                {currentUser.firstname} {currentUser.middlename}{" "}
                {currentUser.lastname}
              </b>
            </span>
            <span>
              E-mail: <b>{currentUser.email}</b>
            </span>
            <button onClick={handleLogout}>
              <p>Logout</p>
            </button>
          </div>
          <div className="title">
            <h1>My List</h1>
            <Link to="/add">
              <button>
                <p>Create New Post</p>
              </button>
            </Link>
          </div>
          <Suspense fallback={<p>Loading your list... Almost there!</p>}>
            <Await
              resolve={data.postResponse}
              errorElement={<p>Error loading posts!</p>}
            >
              {(postResponse) =>
                postResponse.data.userPosts.length > 0 ? (
                  <List posts={postResponse.data.userPosts} />
                ) : (
                  <p>No post created!</p>
                )
              }
            </Await>
          </Suspense>
          <div className="title">
            <h1>Saved List</h1>
          </div>
          <Suspense fallback={<p>Loading your saved list... Almost there!</p>}>
            <Await
              resolve={data.postResponse}
              errorElement={<p>Error loading posts!</p>}
            >
              {(postResponse) =>
                postResponse.data.savedPosts.length > 0 ? (
                  <List posts={postResponse.data.savedPosts} />
                ) : (
                  <p>No post saved!</p>
                )
              }
            </Await>
          </Suspense>
        </div>
      </div>
      <div className="chatContainer">
        <div className="wrapper">
          {/* Pass the chat list from the global store to the Chat component */}
          <Chat chats={chats} />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;


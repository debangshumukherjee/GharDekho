import Chat from "../../components/chat/Chat";
import List from "../../components/list/List";
import "./profilePage.scss";
import apiRequest from "../../lib/apiRequest";
import { Await, Link, useLoaderData, useNavigate } from "react-router-dom";
import { Suspense, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";

function ProfilePage() {
  const data = useLoaderData();
  const { socket } = useContext(SocketContext);

  const { updateUser, currentUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      socket.emit("logout");

      // Optionally, disconnect the socket after emitting the logout event
      socket.disconnect();
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
              {(postResponse) => {
                // Check if there are no posts
                if (postResponse.data.userPosts.length === 0) {
                  return <p>No post created!</p>;
                }

                // If there are posts, render the List
                return <List posts={postResponse.data.userPosts} />;
              }}
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
              {(postResponse) => {
                if (postResponse.data.savedPosts.length === 0) {
                  return <p>No post saved!</p>;
                }
                return <List posts={postResponse.data.savedPosts} />;
              }}
            </Await>
          </Suspense>
        </div>
      </div>
      <div className="chatContainer">
        <div className="wrapper">
          <Suspense fallback={<p>Loading...</p>}>
            <Await
              resolve={data.chatResponse}
              errorElement={<p>Error loading chats!</p>}
            >
              {(chatResponse) => <Chat chats={chatResponse.data} />}
            </Await>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

import "./singlePage.scss";
import Slider from "../../components/slider/Slider";
import Map from "../../components/map/Map";
import { useNavigate, useLoaderData, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";

function SinglePage() {
  const post = useLoaderData();
  const [saved, setSaved] = useState(post?.isSaved || false);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  // New effect: Check if the post exists, if not, redirect to home page
  useEffect(() => {
    if (!post) {
      navigate("/"); // Redirect to the homepage
    }
  }, [post, navigate]);

  const handleSave = async () => {
    if (!currentUser) {
      navigate("/login");
    }
    setSaved((prev) => !prev);
    try {
      await apiRequest.post("/users/save", { postId: post.id });
    } catch (err) {
      console.log(err);
      setSaved((prev) => !prev);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (confirmed) {
      try {
        await apiRequest.delete(`/posts/${post.id}`);
        alert("Post deleted successfully.");
        navigate("/profile"); // Navigate to the user's profile after deletion
      } catch (err) {
        console.log(err);
        alert("Failed to delete the post. Please try again.");
      }
    }
  };

  const handleChat = async () => {
    if (!currentUser) {
      // Redirect to login if user is not logged in
      alert("Please log in to start a chat.");
      return;
    }

    try {
      // Fetch chats for the current user and target user (post.userId)
      const chatResponse = await apiRequest.get(
        `/chats?user1Id=${currentUser.id}&user2Id=${post.userId}`
      );

      console.log(chatResponse);

      if (chatResponse.data && chatResponse.data.length > 0) {
        // Check if the chat is specifically between the current user and the target user
        const existingChat = chatResponse.data.find(
          (chat) =>
            chat.userIDs.includes(currentUser.id) &&
            chat.userIDs.includes(post.userId)
        );

        if (existingChat) {
          // If such a chat exists, set it as the active chat
          console.log("Chat Exists");
          setChat(existingChat);
          setActiveChatId(existingChat.id); // Set the active chat ID
          console.log("inside if statement");
          navigate("/profile");
        } else {
          // If no chat exists specifically between the two users, create a new one
          console.log("No chat between these two users, creating a new chat");
          const newChatResponse = await apiRequest.post("/chats", {
            receiverId: post.userId, // Ensure you're passing the correct receiver ID
          });
          console.log("inside else statement");
          // Set the newly created chat in the state
          setChat(newChatResponse.data);
          setActiveChatId(newChatResponse.data.id); // Set the active chat ID
          navigate("/profile");
        }
      } else {
        // If no chats are found at all, create a new one
        console.log("No chats found, creating a new chat");
        const newChatResponse = await apiRequest.post("/chats", {
          receiverId: post.userId, // Ensure you're passing the correct receiver ID
        });
        console.log("inside else statement");
        // Set the newly created chat in the state
        setChat(newChatResponse.data);
        setActiveChatId(newChatResponse.data.id); // Set the active chat ID
        navigate("/profile");
      }
    } catch (err) {
      console.error("Error handling chat:", err);
      alert("Failed to open or create a chat. Please try again.");
    }
  };

  // const handleToggleStatus = async (req, res) => {
  //   const id = post.id;
  //   try {
  //     const newStatus = !isOccupied;
  //     setIsOccupied(newStatus);
  //     post.status = newStatus; // Immediately update the post status in the UI
  //     await apiRequest.put(`/posts/${id}`, {
  //       id: post.id,
  //       status: newStatus,
  //     });
  //   } catch (error) {
  //     console.error("Failed to update post status:", error);
  //     alert("Error updating post status. Please try again.");
  //     setIsOccupied(!isOccupied); // Revert if there was an error
  //   }
  // };

  const renderNotGiven = (value) => (value ? value : "No information");

  return (
    <div className="singlePage">
      <div className="details">
        <div className="wrapper">
          <Slider images={post.images} />
          <div className="info">
            <div className="top">
              <div className="post">
                <h1>{renderNotGiven(post.title)}</h1>
                <div className="address">
                  <img src="/pin.png" alt="" />
                  <span>
                    {renderNotGiven(post.city)} | {renderNotGiven(post.address)}
                  </span>
                </div>
                <div className="price" style={{ textTransform: "capitalize" }}>
                  {post.type} For Rs. {post.price.toLocaleString(post.price)}
                </div>
                <div>
                  <div>
                    <span className={`status ${post.status ? "occupied" : ""}`}>
                      {post.status ? "Not Available" : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="user">
                <img src={post.user.avatar || "/noavatar.jpg"} alt="" />
                <span>
                  {`${post.user.firstname || ""} ${
                    post.user.middlename || ""
                  } ${post.user.lastname || ""}`}
                </span>
              </div>
            </div>
            <div
              className="bottom"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  renderNotGiven(post.postDetail?.desc)
                ),
              }}
            ></div>
          </div>
        </div>
      </div>
      <div className="features">
        <div className="wrapper">
          <div className="listVertical">
            <div className="feature">
              <img src="/utility.png" alt="" />
              <div className="featureText">
                <span>Utilities</span>
                <p>
                  {renderNotGiven(
                    post.postDetail?.utilities
                      ? post.postDetail.utilities === "owner"
                        ? "Owner is responsible"
                        : "Tenant is responsible"
                      : null
                  )}
                </p>
              </div>
            </div>
            <div className="feature">
              <img src="/pet.png" alt="" />
              <div className="featureText">
                <span>Pet Policy</span>
                <p>
                  {renderNotGiven(
                    post.postDetail?.pet
                      ? post.postDetail.pet === "allowed"
                        ? "Pets Allowed"
                        : "Pets not Allowed"
                      : null
                  )}
                </p>
              </div>
            </div>
            <div className="feature">
              <img src="/fee.png" alt="" />
              <div className="featureText">
                <span>Income Policy</span>
                <p>{renderNotGiven(post.postDetail?.income)}</p>
              </div>
            </div>
          </div>
          <p className="title">Sizes</p>
          <div className="sizes">
            <div className="size">
              <img src="/size.png" alt="" />
              <span>
                {renderNotGiven(
                  post.postDetail?.size ? `${post.postDetail.size} m²` : null
                )}
              </span>
            </div>
            <div className="size">
              <img src="/bed.png" alt="" />
              <span>
                {renderNotGiven(
                  post.bedroom
                    ? `${post.bedroom} bedroom${
                        post.bedroom.length === 1 ? "" : "s"
                      }`
                    : null
                )}
              </span>
            </div>
            <div className="size">
              <img src="/bath.png" alt="" />
              <span>
                {renderNotGiven(
                  post.bathroom
                    ? `${post.bathroom} bathroom${
                        post.bathroom.length === 1 ? "" : "s"
                      }`
                    : null
                )}
              </span>
            </div>
          </div>

          <p className="title">Nearby Places</p>
          <div className="listHorizontal">
            <div className="feature">
              <img src="/school.png" alt="" />
              <div className="featureText">
                <span>School</span>
                <p>
                  {
                    post?.postDetail.school === null
                      ? renderNotGiven() // Show renderNotGiven if the school value is null
                      : post.postDetail.school >= 1000
                      ? (post.postDetail.school / 1000).toFixed(1) + " km away" // Display in km if >= 1 km
                      : post.postDetail.school + " m away" // Otherwise, display in meters
                  }
                </p>
              </div>
            </div>
            <div className="feature">
              <img src="/bus.png" alt="" />
              <div className="featureText">
                <span>Bus Stop</span>
                <p>
                  {renderNotGiven(
                    post?.postDetail.bus
                      ? post.postDetail.bus >= 1000
                        ? (post.postDetail.bus / 1000).toFixed(1) + " km away" // Display in km if >= 1 km
                        : post.postDetail.bus + " m away" // Otherwise, display in meters
                      : null
                  )}
                </p>
              </div>
            </div>
            <div className="feature">
              <img src="/restaurant.png" alt="" />
              <div className="featureText">
                <span>Restaurant</span>
                <p>
                  {renderNotGiven(
                    post?.postDetail.restaurant
                      ? post.postDetail.restaurant >= 1000
                        ? (post.postDetail.restaurant / 1000).toFixed(1) +
                          " km away" // Display in km if >= 1 km
                        : post.postDetail.restaurant + " m away" // Otherwise, display in meters
                      : null
                  )}
                </p>
              </div>
            </div>
          </div>
          <p className="title">Location</p>
          <div className="mapContainer">
            <Map items={[post]} />
          </div>
          <div className="buttons">
            {currentUser?.id !== post.userId && (
              <>
                <button onClick={handleChat}>
                  <img src="/chat.png" alt="" />
                  Send a Message
                </button>

                <button
                  onClick={handleSave}
                  className={`button ${saved ? "saved" : ""}`} // Use conditional class
                  style={{
                    backgroundColor: saved ? "#fece51" : "white",
                  }}
                >
                  <img src="/save.png" alt="" />
                  {saved ? "Place Saved" : "Save the Place"}
                </button>
              </>
            )}
            {currentUser?.id === post.userId && ( // Show update and delete buttons only if the current user is the owner of the post
              <>
                <Link to={`/post/postupdate/${post.id}`}>
                  <button>
                    <img src="update.png" alt="" />
                    Update
                  </button>
                </Link>

                <button onClick={handleDelete} className="deleteButton">
                  <img src="/delete.png" alt="" />
                  Delete Post
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SinglePage;

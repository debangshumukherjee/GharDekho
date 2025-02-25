import { useState, useEffect } from "react";
import "./postUpdatePage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import apiRequest from "../../lib/apiRequest";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";

function PostUpdatePage() {
  const { id } = useParams(); // Extract the post ID from the URL
  // const post = useLoaderData(); // Fetch post data using the loader
  const [value, setValue] = useState(""); // For description
  const [images, setImages] = useState([]); // For uploaded images
  const [deletedImages, setDeletedImages] = useState([]); // Track deleted images
  const [post, setPost] = useState(null); // Store the fetched post data
  const [error, setError] = useState(""); // For error messages
  const [loading, setLoading] = useState(true); // For loading state
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await apiRequest.get(`/posts/${id}`);
        console.log("Fetched data:", res.data);
        setPost(res.data || {});
        setValue(res.data?.postDetail?.desc || "");
        setImages(res.data?.images || []);
      } catch (err) {
        console.error("Error fetching post:", err.response || err);
        setError("Failed to fetch post data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDeleteImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);
    try {
      const res = await apiRequest.put(`/posts/${id}`, {
        post: {
          title: inputs.title,
          price: parseFloat(inputs.price), // Ensure numeric values are properly parsed
          address: inputs.address,
          city: inputs.city,
          bedroom: parseInt(inputs.bedroom),
          bathroom: parseInt(inputs.bathroom),
          type: inputs.type,
          property: inputs.property,
          latitude: inputs.latitude,
          longitude: inputs.longitude,
          images: images, // Ensure `images` is a defined variable or handle here
          status: inputs.status === "true",
        },
        postDetail: {
          desc: value, // Assuming `value` is a state variable
          utilities: inputs.utilities,
          pet: inputs.pet,
          income: inputs.income,
          size: parseInt(inputs.size),
          school: parseInt(inputs.school),
          bus: parseInt(inputs.bus),
          restaurant: parseInt(inputs.restaurant),
        },
      });

      navigate(`/${res.data.id}`); // Navigate to the updated post's page
    } catch (err) {
      console.error("Error updating post:", err.message);
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  // Loading state, display while post data is being fetched
  if (loading) {
    return <div>Loading...</div>;
  }

  // Error handling: display error if any
  if (error) {
    return <div>{error}</div>;
  }

  // Ensure post is valid before rendering form
  if (!post) {
    return <div>Post data not found.</div>;
  }

  return (
    <div className="postUpdate">
      <div className="formContainer">
        <h1>Update Post</h1>
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={post.title}
              />
            </div>
            <div className="item">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                name="price"
                type="number"
                required
                defaultValue={post.price}
              />
            </div>
            <div className="item">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                required
                defaultValue={post.address}
              />
            </div>
            <div className="item description">
              <label htmlFor="desc">Description</label>
              <ReactQuill theme="snow" onChange={setValue} value={value} />
            </div>
            <div className="item">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                type="text"
                required
                defaultValue={post.city}
              />
            </div>
            <div className="item">
              <label htmlFor="bedroom">Bedroom Number</label>
              <input
                id="bedroom"
                name="bedroom"
                type="number"
                min={0}
                defaultValue={post.bedroom || 0}
              />
            </div>
            <div className="item">
              <label htmlFor="bathroom">Bathroom Number</label>
              <input
                id="bathroom"
                name="bathroom"
                type="number"
                min={0}
                defaultValue={post.bathroom || 0}
              />
            </div>
            <div className="item">
              <label htmlFor="latitude">Latitude</label>
              <input
                id="latitude"
                name="latitude"
                type="text"
                required
                defaultValue={post.latitude}
              />
            </div>
            <div className="item">
              <label htmlFor="longitude">Longitude</label>
              <input
                id="longitude"
                name="longitude"
                type="text"
                required
                defaultValue={post.longitude}
              />
            </div>
            <div className="item">
              <label htmlFor="type">Type</label>
              <select name="type" defaultValue={post.type}>
                <option value="rent">Rent</option>
                <option value="buy">Buy</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="property">Property</label>
              <select name="property" defaultValue={post.property}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="utilities">Utilities Policy</label>
              <select name="utilities" defaultValue={post.postDetail.utilities}>
                <option value="owner">Owner is responsible</option>
                <option value="tenant">Tenant is responsible</option>
                <option value="shared">Shared</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="pet">Pet Policy</label>
              <select name="pet" defaultValue={post.postDetail.pet}>
                <option value="allowed">Allowed</option>
                <option value="not-allowed">Not Allowed</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="income">Income Policy</label>
              <input
                id="income"
                name="income"
                type="text"
                placeholder="Income Policy"
                defaultValue={post.postDetail.income}
              />
            </div>
            <div className="item">
              <label htmlFor="size">Total Size (sqft)</label>
              <input
                min={0}
                id="size"
                name="size"
                type="number"
                defaultValue={post.postDetail.size}
              />
            </div>
            <div className="item">
              <label htmlFor="school">Dist from School</label>
              <input
                min={0}
                id="school"
                name="school"
                type="number"
                defaultValue={post.postDetail.school}
              />
            </div>
            <div className="item">
              <label htmlFor="bus">Dist from Bus Stand</label>
              <input
                min={0}
                id="bus"
                name="bus"
                type="number"
                defaultValue={post.postDetail.bus}
              />
            </div>
            <div className="item">
              <label htmlFor="restaurant">Dist from Restaurant</label>
              <input
                min={0}
                id="restaurant"
                name="restaurant"
                type="number"
                defaultValue={post.postDetail.restaurant}
              />
            </div>
            <div className="item">
              <label htmlFor="status">Status</label>
              <select name="status" defaultValue={post.status}>
                <option value="true">Not Available</option>
                <option value="false">Available</option>
              </select>
            </div>
            <div className="item">
              <button type="submit" className="sendButton" disabled={isLoading}>
                Update Post
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="sideContainer">
        {images.map((image, index) => (
          <div key={index} className="imageWrapper">
            <img src={image} alt={`Uploaded ${index}`} />
            <button
              onClick={() => handleDeleteImage(index)}
              className="delete-button"
            >
              <img src="/delete.png" alt="" />
              Delete
            </button>
          </div>
        ))}

        <UploadWidget
          uwConfig={{
            multiple: true,
            cloudName: "ghardekho",
            uploadPreset: "ghardekho",
            folder: "posts",
          }}
          setState={setImages}
        />
      </div>
    </div>
  );
}

export default PostUpdatePage;

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
  const [post, setPost] = useState(null); // Store the fetched post data
  const [error, setError] = useState(""); // For error messages
  const [loading, setLoading] = useState(true); // For loading state
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch existing post data when the component is mounted
  // useEffect(() => {
  //   const fetchPost = async () => {
  //     try {
  //       const res = await apiRequest.get(`/posts/${id}`);
  //       setPost(res.data); // Populate state with fetched data
  //       setValue(res.data.postDetail.desc); // Set the description for ReactQuill
  //       setImages(res.data.images || []); // Set images if they exist
  //     } catch (err) {
  //       console.error(err);
  //       setError("Failed to fetch post data.");
  //     } finally {
  //       setLoading(false); // Set loading to false after fetch attempt
  //     }
  //   };

  //   fetchPost();
  // }, [id]);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const formData = new FormData(e.target);
  //   const inputs = Object.fromEntries(formData);

  //   // Ensure the images array is not empty or undefined
  //   const updatedImages = images.length ? images : post.images;

  //   try {
  //     const res = await apiRequest.put(`/posts/${id}`, {
  //       post: {
  //         title: inputs.title,
  //         price: parseInt(inputs.price),
  //         address: inputs.address,
  //         city: inputs.city,
  //         bedroom: parseInt(inputs.bedroom || 0), // Default to 0 if empty
  //         bathroom: parseInt(inputs.bathroom || 0),
  //         type: inputs.type,
  //         property: inputs.property,
  //         latitude: inputs.latitude.toString(), // Convert to string
  //         longitude: inputs.longitude.toString(), // Convert to string
  //         status: inputs.status === "true", // Convert to boolean
  //         images: updatedImages, // Include images in the request
  //       },
  //       postDetail: {
  //         desc: value, // ReactQuill description
  //         utilities: inputs.utilities,
  //         pet: inputs.pet,
  //         income: inputs.income,
  //         size: parseInt(inputs.size || 0),
  //         school: parseInt(inputs.school || 0),
  //         bus: parseInt(inputs.bus || 0),
  //         restaurant: parseInt(inputs.restaurant || 0),
  //       },
  //     });

  //     // Redirect to the updated post's page
  //     navigate(`/posts/${id}`);
  //   } catch (err) {
  //     console.error(err);
  //     setError(err.response?.data?.message || "Failed to update post.");
  //   }
  // };
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
              <select
                name="utilities"
                defaultValue={post.postDetail.utilities}
              >
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
              {/* <button type="submit" className="sendButton" disabled={isLoading}> */}
                Update Post
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="sideContainer">
        {images.map((image, index) => (
          <img src={image} key={index} alt={`Uploaded ${index}`} />
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

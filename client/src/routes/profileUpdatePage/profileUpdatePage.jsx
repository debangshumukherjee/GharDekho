import { useContext, useState } from "react";
import "./profileUpdatePage.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { useNavigate } from "react-router-dom";
import UploadWidget from "../../components/uploadWidget/UploadWidget";

function ProfileUpdatePage() {
  const { currentUser, updateUser } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for email OTP flow
  const [emailChanged, setEmailChanged] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [newEmail, setNewEmail] = useState(currentUser.email);
  const [otp, setOtp] = useState("");

  const navigate = useNavigate();
  
  // Detect if email has changed
  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setNewEmail(emailValue);
    if (emailValue !== currentUser.email) {
      setEmailChanged(true);
      setOtpSent(false); // Reset OTP state if email is changed again
    } else {
      setEmailChanged(false);
    }
  };

  // Function to request OTP for the new email
  const handleSendOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      await apiRequest.post("/users/send-update-email-otp", { newEmail });
      setOtpSent(true);
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const formData = new FormData(e.target);

    const { firstname, middlename, lastname, username, password } = Object.fromEntries(formData);
    
    // Construct payload
    const payload = {
      firstname,
      middlename,
      lastname,
      username,
      avatar: avatar[0],
    };

    if (password) {
      payload.password = password;
    }
    
    // If email was changed and OTP sent, include them in the payload
    if (emailChanged && otpSent) {
      payload.email = newEmail;
      payload.otp = otp;
    }

    try {
      const res = await apiRequest.put(`/users/${currentUser.id}`, payload);
      updateUser(res.data);
      navigate("/profile");
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profileUpdatePage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Update Profile</h1>
          <div className="item">
            <label htmlFor="firstname">First Name</label>
            <input id="firstname" name="firstname" type="text" defaultValue={currentUser.firstname}/>
          </div>
          <div className="item">
            <label htmlFor="middlename">Middle Name</label>
            <input id="middlename" name="middlename" type="text" defaultValue={currentUser.middlename}/>
          </div>
          <div className="item">
            <label htmlFor="lastname">Last Name</label>
            <input id="lastname" name="lastname" type="text" defaultValue={currentUser.lastname}/>
          </div>
          <div className="item">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" defaultValue={currentUser.username}/>
          </div>
          <div className="item">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue={newEmail} onChange={handleEmailChange}/>
          </div>
           {/* Conditional OTP section */}
          {emailChanged && (
            <div className="otpSection">
              {!otpSent ? (
                <button type="button" onClick={handleSendOtp} disabled={isLoading}>
                  Send OTP to Verify New Email
                </button>
              ) : (
                <>
                  <p>OTP sent to {newEmail}.</p>
                  <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required/>
                </>
              )}
            </div>
          )}
          <div className="item">
            <label htmlFor="password">New Password</label>
            <input id="password" name="password" type="password" />
          </div>
          <button disabled={isLoading}>Update</button>
          {error && <span>{error}</span>}
        </form>
      </div>
      <div className="sideContainer">
        <img src={avatar[0] || currentUser.avatar || "/noavatar.jpg"} alt="" className="avatar" />
        <UploadWidget
          uwConfig={{
            cloudName: "ghardekho",
            uploadPreset: "ghardekho",
            multiple: false,
            maxImageFileSize: 2000000,
            folder: "avatars",
          }}
          setState={setAvatar}
        />
      </div>
    </div>
  );
}

export default ProfileUpdatePage;
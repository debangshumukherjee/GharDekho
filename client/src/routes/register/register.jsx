import { useState } from "react";
import "./register.scss";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "../../lib/apiRequest";

function Register() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // State to manage UI flow
  const [formData, setFormData] = useState({}); // Store form data between steps

  const navigate = useNavigate();

  // Handle initial registration form submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);

    setFormData(data); // Save data for the next step

    try {
      await apiRequest.post("/auth/register", {
        firstname: data.firstname,
        middlename: data.middlename,
        lastname: data.lastname,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      setOtpSent(true); // Switch to OTP verification view
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification form submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const form = new FormData(e.target);
    const otp = form.get("otp");

    try {
      await apiRequest.post("/auth/verify-email", {
        email: formData.email, // Use the email from the previous step
        otp: otp,
      });
      navigate("/login"); // On success, redirect to login
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registerPage">
      <div className="formContainer">
        {!otpSent ? (
          // --- REGISTRATION FORM (STEP 1) ---
          <form onSubmit={handleRegisterSubmit}>
            <h1>Create an Account</h1>
            <input name="firstname" type="text" placeholder="First Name" required/>
            <input name="middlename" type="text" placeholder="Middle Name" />
            <input name="lastname" type="text" placeholder="Last Name" />
            <input name="username" type="text" placeholder="Username" required minLength={3} maxLength={20}/>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required/>
            <div className="btn">
              <button disabled={isLoading}>Register</button>
            </div>
            {error && <span>{error}</span>}
            <div className="sgnin">
              <Link to="/login">Do you have an account?</Link>
            </div>
          </form>
        ) : (
          // --- OTP VERIFICATION FORM (STEP 2) ---
          <form onSubmit={handleOtpSubmit}>
            <h1>Verify Your Email</h1>
            <p>An OTP has been sent to <strong>{formData.email}</strong>. Please enter it below.</p>
            <input name="otp" type="text" placeholder="Enter OTP" required minLength="6" maxLength="6"/>
            <button disabled={isLoading}>Verify</button>
            {error && <span>{error}</span>}
             <a href="#" onClick={() => setOtpSent(false)} style={{fontSize:"14px", color:"gray", textAlign:"center"}}>Go back</a>
          </form>
        )}
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="" />
      </div>
    </div>
  );
}

export default Register;
import { useState } from "react";
import { Link } from "react-router-dom";
import apiRequest from "../../lib/apiRequest";
import "./forgotPasswordPage.scss";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await apiRequest.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgotPasswordPage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Reset Password</h1>
          <p>Enter your email address to receive a password reset link.</p>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <button disabled={isLoading}>Send Reset Link</button>
          {message && <span className="success">{message}</span>}
          {error && <span className="error">{error}</span>}
          <Link to="/login">Back to Login</Link>
        </form>
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="" />
      </div>
    </div>
  );
}

export default ForgotPasswordPage;


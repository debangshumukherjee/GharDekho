import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import apiRequest from "../../lib/apiRequest";
import "./resetPasswordPage.scss";

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
        setError("Invalid or missing reset token. Please request a new link.");
        return;
    }

    setIsLoading(true);

    try {
      const res = await apiRequest.post("/auth/reset-password", { token, password });
      setMessage(res.data.message + " Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 3000); // Redirect after 3 seconds
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="resetPasswordPage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Choose a New Password</h1>
          {!message && (
             <p>Your new password must be different from previous used passwords.</p>
          )}
          <input
            name="password"
            type="password"
            placeholder="New Password"
            required
            onChange={(e) => setPassword(e.target.value)}
            disabled={!!message}
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm New Password"
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!!message}
          />
          <button disabled={isLoading || !!message}>Reset Password</button>
          {error && <span className="error">{error}</span>}
          {message && <span className="success">{message}</span>}
          <Link to="/login">Back to Login</Link>
        </form>
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="" />
      </div>
    </div>
  );
}

export default ResetPasswordPage;


import { useState } from "react";
import { Link } from "react-router-dom";
import apiRequest from "../../lib/apiRequest";
import "./forgotUsernamePage.scss";

function ForgotUsernamePage() {
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
      const res = await apiRequest.post("/auth/forgot-username", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgotUsernamePage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Forgot Username</h1>
          <p>Enter your email address and we will send you your username.</p>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <button disabled={isLoading}>Submit</button>
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

export default ForgotUsernamePage;


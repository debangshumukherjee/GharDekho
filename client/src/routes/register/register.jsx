import "./register.scss";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import apiRequest from "../../lib/apiRequest";

function Register() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const formData = new FormData(e.target);

    const firstname = formData.get("firstname");
    const middlename = formData.get("middlename") || "";
    const lastname = formData.get("lastname") || "";
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await apiRequest.post("/auth/register", {
        firstname,
        middlename,
        lastname,
        username,
        email,
        password,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="registerPage">
      <div className="formContainer">
        <h1>Create an Account</h1>
        <form onSubmit={handleSubmit}>
          <input
            name="firstname"
            type="text"
            placeholder="First Name"
            required
          />
          <input name="middlename" type="text" placeholder="Middle Name" />
          <input name="lastname" type="text" placeholder="Last Name" />
          <input
            name="username"
            type="text"
            placeholder="Username"
            required
            minLength={3}
            maxLength={20}
          />
          <input name="email" type="text" placeholder="Email" required />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <div className="btn">
            <button disabled={isLoading}>Register</button>
          </div>
          {error && <span>{error}</span>}
          <div className="sgnin">
            <Link to="/login">Do you have an account?</Link>
          </div>
        </form>
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="" />
      </div>
    </div>
  );
}

export default Register;

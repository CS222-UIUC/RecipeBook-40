import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PasswordReset.css";

const PasswordReset = () => {
  const [searchParams] = useSearchParams(); // To extract the token from the URL
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = searchParams.get("token"); // Extract the token from the URL

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setMessage("");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5000/reset-password", {
        token,
        new_password: newPassword,
      });

      setMessage(response.data.message);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "An error occurred.");
      setMessage("");
    }
  };

  return (
    <div className="password-reset-container">
      <h2>Reset Your Password</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{
              padding: "10px",
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              padding: "10px",
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        {error && <p className="password-reset-error">{error}</p>}
        <div>
        <button class="password-reset-button">
          Reset Password
        </button>
      
      <button
        onClick={() => navigate("/login")}
        className="password-reset-button"
      >
        Back to Login
      </button>
      </div>
      {message && <p style={{ color: "green" }}>{message}</p>}
      </form>
    </div>
  );
};

export default PasswordReset;

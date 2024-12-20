import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginSignup.css";

import user_icon from "../Assets/person.png";
import password_icon from "../Assets/password.png";
import email_icon from "../Assets/email.png";

axios.defaults.baseURL = "http://127.0.0.1:5000";

const LostCredentialsModal = ({ action, onClose }) => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async () => {
        try {
            const endpoint = action === "Lost Username" ? "/lost-username" : "/reset-password-request";
            const res = await axios.post(endpoint, { email });
            setMessage(res.data.message);
        } catch (error) {
            setMessage(error.response?.data?.message || "An error occurred");
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>{action}</h2>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={handleSubmit}>Submit</button>
                <button className="close-btn" onClick={onClose}>
                    Close
                </button>
                {message && <div className="message-2">{message}</div>}
            </div>
        </div>
    );
};

const LoginSignup = () => {
    const [action, setAction] = useState("Login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLostModal, setShowLostModal] = useState(false);
    const [lostAction, setLostAction] = useState("Lost Username");
    const navigate = useNavigate();

    const handleLostClick = (action) => {
        setLostAction(action);
        setShowLostModal(true);
    };

    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setIsAuthenticated(false);
                return;
            }

            try {
                const res = await axios.get("/auth-status", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.data.isAuthenticated) {
                    setIsAuthenticated(true);
                    localStorage.setItem("username", res.data.user.username);
                    navigate("/recipes");
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Error checking auth status", error);
                setIsAuthenticated(false);
            }
        };

        checkAuthStatus();
    }, [navigate]);

    const handleSubmit = async () => {
        try {
            if (action === "Sign Up") {
                const res = await axios.post("/signup", { username, email, password });
                setMessage(res.data.message || "Sign-up successful!");
            } else if (action === "Login") {
                const res = await axios.post("/login", { username, password });
                const token = res.data.token;
                if (token) {
                    localStorage.setItem("token", token);
                    localStorage.setItem("username", username);
                    setIsAuthenticated(true);
                    navigate("/recipes");
                }
                setMessage(res.data.message || "Login successful");
            }
        } catch (error) {
            console.error("Error:", error.response?.data || error.message);
            setMessage(error.response?.data?.message || "An error occurred");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setMessage("Logged out successfully");
        navigate("/login");
    };

    return (
        <div className="container">
            {isAuthenticated ? (
                <div className="placeholder">
                    <h2>Welcome, {localStorage.getItem("username")}!</h2>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <div className="full">
                    <div className="header">
                        <div className="text">{action}</div>
                        <div className="underline"></div>
                    </div>
                    <div className="inputs">
                        <div className="input">
                            <img src={user_icon} alt="User Icon" />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        {action === "Sign Up" && (
                            <div className="input">
                                <img src={email_icon} alt="Email Icon" />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="input">
                            <img src={password_icon} alt="Password Icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="submit-container-2">
                        <div className="submit-2" onClick={handleSubmit}>
                            Submit
                        </div>
                    </div>
                    {action === "Sign Up" ? null : (
                            // <div className="forgot-password">
                            //     Lost Username or Password? <span>Click Here!</span>
                            // </div>
                            <div className="forgot-password">
                                Lost Username or Password?{" "}
                                <span onClick={() => handleLostClick("Lost Username")}>
                                    Username
                                </span>{" "}
                                |{" "}
                                <span onClick={() => handleLostClick("Reset Password")}>
                                    Password
                                </span>
                            </div>
                        )}
                        {showLostModal && console.log("Modal is being rendered")}
                            {showLostModal && (
                                <LostCredentialsModal
                                    action={lostAction}
                                    onClose={() => setShowLostModal(false)}
                                />
                            )}

                    <div className="submit-container">
                        <div
                            className={action === "Login" ? "submit gray" : "submit"}
                            onClick={() => setAction("Sign Up")}
                        >
                            Sign Up Page
                        </div>
                        <div
                            className={action === "Sign Up" ? "submit gray" : "submit"}
                            onClick={() => setAction("Login")}
                        >
                            Log In Page
                        </div>
                    </div>
                    {message && <div className="message">{message}</div>}
                </div>
            )}
        </div>
    );
};

export default LoginSignup;
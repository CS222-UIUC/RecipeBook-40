import React, { useState, useEffect } from "react";
import axios from 'axios';
import './LoginSignup.css';

import user_icon from '../Assets/person.png';
import email_icon from '../Assets/email.png';
import password_icon from '../Assets/password.png';

const LoginSignup = () => {
    const [action, setAction] = useState("Login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:5000/auth-status", { withCredentials: true });
                setIsAuthenticated(res.data.isAuthenticated);
            } catch (error) {
                console.error("Error checking auth status", error);
            }
        };
        checkAuthStatus();
    }, []);

    const handleSubmit = async () => {
        try {
            if (action === "Sign Up") {
                const res = await axios.post(
                    'http://127.0.0.1:5000/signup', 
                    { username, email, password },
                    { withCredentials: true }
                );
                setMessage(res.data.message || "Sign-up successful!");
            } else if (action === "Login") {
                const res = await axios.post(
                    'http://127.0.0.1:5000/login', 
                    { email, password },
                    { withCredentials: true }
                );
                setMessage(res.data.message);
                if (res.data.message === "Login successful") {
                    setIsAuthenticated(true);
                }
            }
        } catch (error) {
            console.error("Error:", error.response?.data || error.message);
            setMessage(error.response?.data.error || "An error occurred");
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(
                'http://127.0.0.1:5000/logout', 
                {}, 
                { withCredentials: true }  // Include credentials
            );
            setIsAuthenticated(false);
            setMessage("Logged out successfully");
        } catch (error) {
            setMessage("Failed to log out");
        }
    };

    return (
        <div className='container'>
            {isAuthenticated ? (
                <div>
                    <h2>Welcome back!</h2>
                    <button onClick={handleLogout}>Logout</button>
                    {message && <div className="message">{message}</div>}
                </div>
            ) : (
                <div>
                    <div className="header">
                        <div className="text">{action}</div>
                        <div className="underline"></div>
                    </div>
                    <div className="inputs">
                        {action === "Login" ? null : (
                            <div className="input">
                                <img src={user_icon} alt="User Icon" />
                                <input 
                                    type="text" 
                                    placeholder="Name" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                />
                            </div>
                        )}
                        <div className="input">
                            <img src={email_icon} alt="Email Icon" />
                            <input 
                                type="email" 
                                placeholder="Email Id" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>
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
                        {action === "Sign Up" ? null : (
                            <div className="forgot-password">
                                Lost Password? <span>Click Here!</span>
                            </div>
                        )}
                        <div className="submit-2" onClick={handleSubmit}>Submit</div>
                    </div>
                    <div className="submit-container">
                        <div 
                            className={action === "Login" ? "submit gray" : "submit"} 
                            onClick={() => setAction("Sign Up")}
                        >
                            Sign Up
                        </div>
                        <div 
                            className={action === "Sign Up" ? "submit gray" : "submit"} 
                            onClick={() => setAction("Login")}
                        >
                            Log In
                        </div>
                    </div>
                    {message && <div className="message">{message}</div>}
                </div>
            )}
        </div>
    );
};

export default LoginSignup;
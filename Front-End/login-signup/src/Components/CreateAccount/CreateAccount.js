import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import LoginSignup from "../LoginSignup/LoginSignup";

import user_icon from '../Assets/person.png';
import email_icon from '../Assets/email.png';
import password_icon from '../Assets/password.png';

const CreateAccount = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleCreateAccount = async () => {
        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        try {
            const res = await axios.post(
                'http://127.0.0.1:5000/signup',
                { username, email, password },
                { withCredentials: true }
            );
            setMessage(res.data.message || "Account created successfully!");
            navigate("/login");
        } catch (error) {
            setMessage(error.response?.data.message || "An error occurred");
        }
    };

    return (
        <div className="container">
            <div className="full">
                <div className="header">
                    <div className="text">Create Account</div>
                    <div className="underline"></div>
                </div>
                <div className="inputs">
                    <div className="input">
                        <img src={user_icon} alt="User Icon" />
                        <input 
                            type="text" 
                            placeholder="Name" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                        />
                    </div>
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
                    <div className="input">
                        <img src={password_icon} alt="Confirm Password Icon" />
                        <input 
                            type="password" 
                            placeholder="Confirm Password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                        />
                    </div>
                </div>
                <div className="submit-2" onClick={handleCreateAccount}>Create Account</div>
                {message && <div className="message">{message}</div>}
            </div>
        </div>
    );
};

export default CreateAccount;
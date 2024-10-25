// import React from 'react'
import './LoginSignup.css'
import React, { useState } from "react";
import axios from 'axios';


import user_icon from '../Assets/person.png'
import email_icon from '../Assets/email.png'
import password_icon from '../Assets/password.png'

const LoginSignup = () => {

    const [action,setAction] = useState("Login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async () => {
        if (action === "Sign Up") {
            try {
                const res = await axios.post('http://localhost:5000/signup', { 
                    username, 
                    email, 
                    password 
                });
                setMessage(res.data.message);
            } catch (error) {
                setMessage(error.response?.data.error || "An error occurred");
            }
        } else if (action === "Login") {
            try {
                const res = await axios.post('http://localhost:5000/login', { 
                    email, 
                    password 
                });
                setMessage(res.data.message);
            } catch (error) {
                setMessage(error.response?.data.message || "An error occurred");
            }
        }
    };

    return (
        <div className = 'container'>
            <div className = "header">
                <div className = "text">{action}</div>
                <div className = "underline"></div>
            </div>
            <div className = "inputs">
                {action==="Login"?<div></div>:<div className="input">
                    <img src={user_icon} alt="" />
                    <input type="text" placeholder="Name" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>}
                <div className="input">
                    <img src={email_icon} alt="" />
                    <input type="email" placeholder='Email Id' value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
                <div className="input">
                    <img src={password_icon} alt="" />
                    <input type="password" placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
            </div>
            <div className="submit-container-2">
                {action=== "Sign Up"? <div ></div> :<div className="forgot-password">Lost Password? <span>Click Here!</span></div>}
                <div className={"submit-2"} onClick={handleSubmit}>Submit</div>
            </div>
            <div className="submit-container">
                <div className={action==="Login"?"submit gray":"submit"} onClick={()=>{setAction("Sign Up")}}>Sign Up</div>
                <div className={action==="Sign Up"?"submit gray":"submit"} onClick={()=>{setAction("Login")}}>Log In</div>
            </div>
        </div>
    )
}

export default LoginSignup
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./AccountInformation.css";

axios.defaults.baseURL = "http://127.0.0.1:5000";

const NavBar = ({ handleLogout }) => {
    return (
        <nav className="navbar">
            <h2 className="navbar-title">Dish Diaries</h2>
            <div className="navbar-links">
                <Link to="/recipes">Add Recipes</Link>
                <Link to="/my-recipes">My Recipes</Link>
                <Link to="/group-recipes">Group Recipes</Link>
                <Link to="/account">Account Information</Link>
                <button onClick={handleLogout} className="logout-button">
                    Log Out
                </button>
            </div>
        </nav>
    );
};

const AccountInformation = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({});
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const navigate = useNavigate();

    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.post(
                "/logout",
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            navigate("/login");
        } catch (error) {
            console.error("Error during logout:", error.response?.data || error.message);
        }
    };

    useEffect(() => {
        const fetchAccountInfo = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }
            try {
                const response = await axios.get("/account", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data.user);
                setStats(response.data.stats);
            } catch (error) {
                console.error("Error fetching account information:", error);
                navigate("/login");
            }
        };

        fetchAccountInfo();
    }, [navigate]);

    const handleUsernameChange = async () => {
        const token = localStorage.getItem("token");
        try {
            console.log("Sending request to update username:", newUsername);
            const response = await axios.put(
                "/account/username",
                { username: newUsername },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Response from server:", response.data);
            alert("Username updated successfully!");
            setUser((prev) => ({ ...prev, username: newUsername }));
            setIsEditingUsername(false);
        } catch (error) {
            console.error("Error updating username:", error.response?.data || error.message);
            alert("Failed to update username.");
        }
    };
    
    const handlePasswordChange = async () => {
        const token = localStorage.getItem("token");
        try {
            console.log("Sending request to update password");
            const response = await axios.put(
                "/account/password",
                { password: newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Response from server:", response.data);
            alert("Password updated successfully!");
            setIsEditingPassword(false);
        } catch (error) {
            console.error("Error updating password:", error.response?.data || error.message);
            alert("Failed to update password.");
        }
    };
    

    if (!user) {
        return <p>Loading account information...</p>;
    }

    return (
        <div>
            <NavBar handleLogout={handleLogout} />
            <div className="account-information">
                <h1>Account Information</h1>
                <p>
                    <strong>Username: </strong>
                    {isEditingUsername ? (
                        <>
                            <input
                                type="text"
                                placeholder="Enter new username"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                            <button onClick={handleUsernameChange}>Save</button>
                            <button onClick={() => setIsEditingUsername(false)}>Cancel</button>
                        </>
                    ) : (
                        <>
                            {user.username}{" "}
                            <button onClick={() => {
                                setIsEditingUsername(true);
                                setNewUsername(""); // Clear the input when entering edit mode
                            }}>
                                Edit
                            </button>
                        </>
                    )}
                </p>
                <p>
                    <strong>Email:</strong> {user.email}
                </p>
                <p>
                    <strong>Member since:</strong> {new Date(user.memberSince).toLocaleDateString()}
                </p>
                <p>
                    <strong>Total Recipes:</strong> {stats.totalRecipes}
                </p>

                <h2>Change Password</h2>
                {isEditingPassword ? (
                    <div>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button onClick={handlePasswordChange}>Save</button>
                        <button onClick={() => {
                            setIsEditingPassword(false);
                            setNewPassword(""); // Clear the password field on cancel
                        }}>Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditingPassword(true)}>Change Password</button>
                )}
            </div>
        </div>
    );
};

export default AccountInformation;

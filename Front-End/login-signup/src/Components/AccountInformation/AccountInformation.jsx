import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = "http://127.0.0.1:5000";

const AccountInformation = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({});
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAccountInfo = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("/account", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data.user);
                setStats(response.data.stats);
            } catch (error) {
                console.error("Error fetching account information:", error);
            }
        };

        fetchAccountInfo();
    }, []);

    const handleUsernameChange = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(
                "/account/username",
                { username: newUsername },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Username updated successfully!");
            setUser((prev) => ({ ...prev, username: newUsername }));
            setIsEditingUsername(false);
        } catch (error) {
            console.error("Error updating username:", error);
            alert("Failed to update username.");
        }
    };

    const handlePasswordChange = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(
                "/account/password",
                { password: newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Password updated successfully!");
            setIsEditingPassword(false);
        } catch (error) {
            console.error("Error updating password:", error);
            alert("Failed to update password.");
        }
    };

    if (!user) {
        return <p>Loading account information...</p>;
    }

    return (
        <div className="account-information">
            <h1>Account Information</h1>
            <p>
                <strong>Username:</strong> {user.username}{" "}
                {isEditingUsername ? (
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                    />
                ) : null}
                {isEditingUsername ? (
                    <button onClick={handleUsernameChange}>Save</button>
                ) : (
                    <button onClick={() => setIsEditingUsername(true)}>Edit</button>
                )}
            </p>
            <p>
                <strong>Email:</strong> {user.email}
            </p>
            <p>
                <strong>Member since:</strong> {new Date(user.joinedAt).toLocaleDateString()}
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
                </div>
            ) : (
                <button onClick={() => setIsEditingPassword(true)}>Change Password</button>
            )}
        </div>
    );
};

export default AccountInformation;
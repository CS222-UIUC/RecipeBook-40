import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./MyRecipes.css";

axios.defaults.baseURL = "http://127.0.0.1:5000";


const NavBar = ({ handleLogout, isLoggingOut }) => {
    return (
        <nav className="navbar">
            <h2 className="navbar-title">Dish Diaries</h2>
            <div className="navbar-links">
                <Link to="/recipes">Add Recipes</Link>
                <Link to="/my-recipes">My Recipes</Link>
                <Link to="/group-recipes">Group Recipes</Link>
                <Link to="/account">Account Information</Link>
                <button onClick={handleLogout} disabled={isLoggingOut} className="logout-button">
                    {isLoggingOut ? "Logging Out..." : "Log Out"}
                </button>
            </div>
        </nav>
    );
};



const MyRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.post(
                "/logout",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
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
        const fetchRecipes = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const res = await axios.get("/recipes", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRecipes(res.data.recipes);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching recipes:", error);
                navigate("/login");
            }
        };

        fetchRecipes();
    }, [navigate]);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="my-recipes-page">
            {/* Pass handleLogout as a prop */}
            <NavBar handleLogout={handleLogout} isLoggingOut={false} />
            <div className="recipe-container">
            {recipes.length > 0 ? (
                    recipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            className="recipe-card"
                            onClick={() => navigate(`/recipes/${recipe.id}`)} // Navigate to details page
                        >
                            <h3>{recipe.name}</h3>
                            <p>{recipe.description}</p>
                        </div>
                    ))
                ) : (
                    <p>No recipes found. Add some recipes!</p>
                )}
            </div>
        </div>
    );
};

export default MyRecipes;
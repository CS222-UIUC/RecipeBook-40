import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./RecipeDetails.css";

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

const RecipeDetails = () => {
    const { id } = useParams();
    const [recipe, setRecipe] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecipe = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`/recipes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRecipe(response.data.recipe);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching recipe details:", error);
                setIsLoading(false);
            }
        };

        fetchRecipe();
    }, [id]);

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

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!recipe) {
        return (
            <div className="recipe-details">
                <NavBar handleLogout={handleLogout} />
                <p>Recipe not found.</p>
            </div>
        );
    }

    return (
        <div className="recipe-details">
            <NavBar handleLogout={handleLogout} />
            <h1>{recipe.name}</h1>
            <p>{recipe.description}</p>
            <div className="ingredients-steps-container">
                {/* Ingredients Section */}
                <div className="ingredients">
                    <h3>Ingredients:</h3>
                    {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
                        <ul>
                            {recipe.ingredients.map((ingredient, index) => (
                                <li key={index}>{ingredient}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-items">No ingredients listed</p>
                    )}
                </div>

                {/* Steps Section */}
                <div className="steps">
                    <h3>Steps:</h3>
                    {Array.isArray(recipe.steps) && recipe.steps.length > 0 ? (
                        <ol>
                            {recipe.steps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                    ) : (
                        <p className="no-items">No steps listed</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecipeDetails;

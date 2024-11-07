import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './RecipeBoard.css';

const NavBar = ({ handleLogout, isLoggingOut }) => {
    return (
        <nav className="navbar">
            <h2 className="navbar-title">Dish Diaries</h2>
            <div className="navbar-links">
                <Link to="/my-recipes">My Recipes</Link>
                <Link to="/group-recipes">Group Recipes</Link>
                <Link to="/meal-plans">Meal Plans</Link>
                <Link to="/about">About Us</Link>
                <Link to="/account">Account Information</Link>
                <button onClick={handleLogout} disabled={isLoggingOut} className="logout-button">
                    {isLoggingOut ? "Logging Out..." : "Log Out"}
                </button>
            </div>
        </nav>
    );
};

const RecipeBoard = () => {
    const [recipes, setRecipes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("isAuthenticated") === "true");
    const [showForm, setShowForm] = useState(false);
    const [newRecipe, setNewRecipe] = useState({
        name: "",
        description: "",
        steps: [""],
        ingredients: [""],
        isPersonal: true,
        users: ""
    });
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Check authentication status only if not cached
    useEffect(() => {
        if (!isAuthenticated) {
            const checkAuthStatus = async () => {
                try {
                    const authResponse = await axios.get("http://127.0.0.1:5000/auth-status", { withCredentials: true });
                    if (authResponse.data.isAuthenticated) {
                        setIsAuthenticated(true);
                        localStorage.setItem("isAuthenticated", "true");
                    } else {
                        navigate("/login");
                    }
                } catch (error) {
                    console.error("Error checking authentication status:", error);
                    navigate("/login");
                } finally {
                    setIsLoading(false);
                }
            };
            checkAuthStatus();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, navigate]);

    // Handle logout
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const response = await axios.post("http://127.0.0.1:5000/logout", {}, { withCredentials: true });
            if (response.status === 200) {
                localStorage.removeItem("isAuthenticated");
                setIsAuthenticated(false);
                navigate("/login");
            } else {
                console.error("Unexpected response during logout:", response);
            }
        } catch (error) {
            console.error("Failed to log out:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Toggle form visibility
    const toggleForm = () => {
        setShowForm(!showForm);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewRecipe({ ...newRecipe, [name]: value });
    };

    // Handle steps change
    const handleStepChange = (index, value) => {
        const updatedSteps = [...newRecipe.steps];
        updatedSteps[index] = value;
        setNewRecipe({ ...newRecipe, steps: updatedSteps });
    };

    // Handle ingredients change
    const handleIngredientChange = (index, value) => {
        const updatedIngredients = [...newRecipe.ingredients];
        updatedIngredients[index] = value;
        setNewRecipe({ ...newRecipe, ingredients: updatedIngredients });
    };

    // Add a new empty step
    const addStep = () => {
        setNewRecipe({ ...newRecipe, steps: [...newRecipe.steps, ""] });
    };

    // Add a new empty ingredient
    const addIngredient = () => {
        setNewRecipe({ ...newRecipe, ingredients: [...newRecipe.ingredients, ""] });
    };

    // Remove a step by index
    const removeStep = (index) => {
        const updatedSteps = newRecipe.steps.filter((_, i) => i !== index);
        setNewRecipe({ ...newRecipe, steps: updatedSteps });
    };

    // Remove an ingredient by index
    const removeIngredient = (index) => {
        const updatedIngredients = newRecipe.ingredients.filter((_, i) => i !== index);
        setNewRecipe({ ...newRecipe, ingredients: updatedIngredients });
    };

    // Handle form submission
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://127.0.0.1:5000/add-recipe", newRecipe, { withCredentials: true });
            if (response.status === 200) {
                setRecipes([...recipes, newRecipe]);
                setNewRecipe({ name: "", description: "", steps: [""], ingredients: [""], isPersonal: true, users: "" });
                setShowForm(false);
            }
        } catch (error) {
            console.error("Error adding recipe:", error);
        }
    };

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="recipe-board">
            <NavBar handleLogout={handleLogout} isLoggingOut={isLoggingOut} />
            <div className="content">
                <h2>Welcome to your Recipe Board!</h2>
                <button onClick={toggleForm} className="add-recipe-button">
                    {showForm ? "Close Form" : "Click here to add Recipes!"}
                </button>

                {showForm && (
    <form onSubmit={handleFormSubmit} className="recipe-form">
        <div className="form-header">
            <label>
                Recipe Name:
                <input
                    type="text"
                    name="name"
                    value={newRecipe.name}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                />
            </label>
            <label>
                Description:
                <textarea
                    name="description"
                    value={newRecipe.description}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                />
            </label>
        </div>

        {/* Flex container for ingredients and steps */}
        <div className="form-layout">
            {/* Ingredients Section */}
            <div className="ingredients-section">
                <h3>Ingredients</h3>
                {newRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="ingredient-input-container">
                        <input
                            type="text"
                            placeholder={`Ingredient ${index + 1}`}
                            value={ingredient}
                            onChange={(e) => handleIngredientChange(index, e.target.value)}
                            required
                            className="form-input"
                        />
                        <button type="button" onClick={() => removeIngredient(index)} className="remove-button">Remove</button>
                    </div>
                ))}
                <button type="button" onClick={addIngredient} className="add-ingredient-button">Add Ingredient</button>
            </div>

            {/* Steps Section */}
            <div className="steps-section">
                <h3>Steps</h3>
                {newRecipe.steps.map((step, index) => (
                    <div key={index} className="step-input-container">
                        <input
                            type="text"
                            placeholder={`Step ${index + 1}`}
                            value={step}
                            onChange={(e) => handleStepChange(index, e.target.value)}
                            required
                            className="form-input"
                        />
                        <button type="button" onClick={() => removeStep(index)} className="remove-button">Remove</button>
                    </div>
                ))}
                <button type="button" onClick={addStep} className="add-step-button">Add Step</button>
            </div>
        </div>

        <label>
            <input
                type="checkbox"
                name="isPersonal"
                checked={newRecipe.isPersonal}
                onChange={(e) => setNewRecipe({ ...newRecipe, isPersonal: e.target.checked })}
            />
            Make Recipe Personal
        </label>
        {!newRecipe.isPersonal && (
            <label>
                Add Users (comma-separated usernames):
                <input
                    type="text"
                    name="users"
                    value={newRecipe.users}
                    onChange={handleInputChange}
                    placeholder="e.g., user1, user2"
                    className="form-input"
                />
            </label>
        )}
        <button type="submit">Add Recipe</button>
    </form>
)}




            </div>
        </div>
    );
};

export default RecipeBoard;

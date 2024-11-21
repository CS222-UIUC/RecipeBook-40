import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './RecipeBoard.css';
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://127.0.0.1:5000';


const NavBar = ({ handleLogout, isLoggingOut }) => {
    return (
        <nav className="navbar">
            <h2 className="navbar-title">Dish Diaries</h2>
            <div className="navbar-links">
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
        users: "",
        owner: "",
    });
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Refs for dynamically resizing inputs
    const nameRef = useRef(null);
    const descriptionRef = useRef(null);
    const ownerRef = useRef(null);
    const ingredientsRefs = useRef([]);
    const stepsRefs = useRef([]);
    const sharedRefs = useRef([]);
    const username = localStorage.getItem("username");

    // Initial state for form reset
    const initialRecipeState = {
        owner: {username},
        name: "",
        description: "",
        steps: [""],
        ingredients: [""],
        isPersonal: true,
        users: ""
    };

    const adjustHeight = (ref) => {
        if (ref) {
            ref.style.height = "auto";
            ref.style.height = `${ref.scrollHeight}px`;
        }
    };

    const handleInputChange = (e, ref) => {
        const { name, value } = e.target;
        setNewRecipe((prev) => ({ ...prev, [name]: value }));
        adjustHeight(ref.current);
    };

    const handleDynamicChange = (index, value, type) => {
        const updateFn = type === "ingredient" ? "ingredients" : "steps";
        const refList = type === "ingredient" ? ingredientsRefs : stepsRefs;
        const updatedValues = [...newRecipe[updateFn]];
        updatedValues[index] = value;
        setNewRecipe({ ...newRecipe, [updateFn]: updatedValues });
        adjustHeight(refList.current[index]);
    };

    useEffect(() => {
        ingredientsRefs.current.forEach((ref) => adjustHeight(ref));
        stepsRefs.current.forEach((ref) => adjustHeight(ref));
    }, [newRecipe.ingredients, newRecipe.steps]);

    const addIngredient = () => {
        setNewRecipe((prevRecipe) => ({
            ...prevRecipe,
            ingredients: [...prevRecipe.ingredients, ""]
        }));
    };

    const removeIngredient = (index) => {
        if (newRecipe.ingredients.length > 1) {
            setNewRecipe((prevRecipe) => ({
                ...prevRecipe,
                ingredients: prevRecipe.ingredients.filter((_, i) => i !== index)
            }));
        }
    };

    const addStep = () => {
        setNewRecipe((prevRecipe) => ({
            ...prevRecipe,
            steps: [...prevRecipe.steps, ""]
        }));
    };

    const removeStep = (index) => {
        if (newRecipe.steps.length > 1) {
            setNewRecipe((prevRecipe) => ({
                ...prevRecipe,
                steps: prevRecipe.steps.filter((_, i) => i !== index)
            }));
        }
    };

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

    const toggleForm = () => {
        if (showForm) {
            // Reset the form when closing
            setNewRecipe(initialRecipeState);
        }
        setShowForm(!showForm);
    };

    const handleFormSubmit = async (e) => {
        // e.preventDefault();

        const form = e.target;

        // Check form validity
        if (!form.checkValidity()) {
            form.reportValidity();  // This triggers the browser’s validation messages
            return;
        }
        try {
            const response = await axios.post("http://127.0.0.1:5000/add-recipe", newRecipe, { withCredentials: true });
            if (response.status === 200) {
                setRecipes([...recipes, newRecipe]);
                setNewRecipe(initialRecipeState);
                setShowForm(false);
            }
        } catch (error) {
            console.error("Error adding recipe:", error);
        }
    };

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

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="recipe-board">
            <NavBar handleLogout={handleLogout} isLoggingOut={isLoggingOut} />
            <div className="content">
                <h2>Welcome to your Recipe Board, {username}!</h2>
                <button onClick={toggleForm} className="add-recipe-button">
                    {showForm ? "Close Form" : "Click Here to Add Recipes"}
                </button>

                {showForm && (
                    <form onSubmit={handleFormSubmit} className="recipe-form">
                        <div className="form-header">
                            <label>
                            <h3>Recipe Name:</h3>
                                <input
                                    type="text"
                                    name="name"
                                    value={newRecipe.name}
                                    onChange={(e) => handleInputChange(e, nameRef)}
                                    ref={nameRef}
                                    required
                                    className="form-input"
                                />
                            </label>
                            <label>
                            <h3>Description:</h3>
                                <textarea
                                    name="description"
                                    value={newRecipe.description}
                                    onChange={(e) => handleInputChange(e, descriptionRef)}
                                    ref={descriptionRef}
                                    required
                                    className="form-input"
                                />
                            </label>
                        </div>
                        <div className="form-layout">
                            <div className="ingredients-section">
                                <h3>Ingredients</h3>
                                {newRecipe.ingredients.map((ingredient, index) => (
                                    <div key={index} className="ingredient-input-container">
                                        <textarea
                                            placeholder={`Ingredient ${index + 1}`}
                                            value={ingredient}
                                            onChange={(e) => handleDynamicChange(index, e.target.value, "ingredient")}
                                            ref={(el) => ingredientsRefs.current[index] = el}
                                            className="form-input"
                                        />
                                            <button
                                                type="button"
                                                onClick={() => removeIngredient(index)}
                                                className="remove-button"
                                            >
                                                Remove
                                            </button>
                                    </div>
                                ))}
                                <button type="button" onClick={addIngredient} className="add-ingredient-button">Add Ingredient</button>
                            </div>

                            <div className="steps-section">
                                <h3>Steps</h3>
                                {newRecipe.steps.map((step, index) => (
                                    <div key={index} className="step-input-container">
                                        <textarea
                                            placeholder={`Step ${index + 1}`}
                                            value={step}
                                            onChange={(e) => handleDynamicChange(index, e.target.value, "step")}
                                            ref={(el) => stepsRefs.current[index] = el}
                                            className="form-input"
                                        />
                                            <button
                                                type="button"
                                                onClick={() => removeStep(index)}
                                                className="remove-button"
                                            >
                                                Remove
                                            </button>
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
                            Make Recipe Private
                        </label>
                        
                        {!newRecipe.isPersonal && (
                            <div className="add-users">
                            <label>
                                Add Users (comma-separated usernames):
                                <textarea
                                    placeholder="user1, user2, etc."
                                    name="users"
                                    value={newRecipe.users}
                                    onChange={(e) => handleInputChange(e, sharedRefs)}
                                    ref={sharedRefs}
                                    className="form-input"
                                />
                            </label>
                            </div>
                        )}
                        <button type="submit" className="submit-button">Add Recipe</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RecipeBoard;
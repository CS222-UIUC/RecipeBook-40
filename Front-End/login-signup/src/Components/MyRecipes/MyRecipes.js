import React, { useState } from "react";
import "./MyRecipes.module.css"; 

const MyRecipes = () => {
    const [recipes, setRecipes] = useState([
        { id: 1, title: "Spaghetti Bolognese", description: "A classic Italian pasta dish with a rich meat sauce." },
        { id: 2, title: "Vegetable Stir Fry", description: "Quick and healthy stir-fried veggies in a tangy sauce." },
        { id: 3, title: "Chocolate Cake", description: "Decadent chocolate cake with a creamy frosting." },
    ]);

    return (
        <div className="container">
            <div className="full">
                <div className="header">
                    <div className="text">My Recipes</div>
                    <div className="underline"></div>
                </div>
                <div className="recipes-list">
                    {recipes.map((recipe) => (
                        <div key={recipe.id} className="recipe-card">
                            <div className="recipe-title">{recipe.title}</div>
                            <div className="recipe-description">{recipe.description}</div>
                        </div>
                    ))}
                </div> 
            </div>
        </div>
    );
};

export default MyRecipes;
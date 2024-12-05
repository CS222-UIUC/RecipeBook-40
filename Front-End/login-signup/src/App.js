import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home/Home';
import LoginSignup from './Components/LoginSignup/LoginSignup';
import RecipeBoard from './Components/Recipes/RecipeBoard';
import CreateAccount from './Components/CreateAccount/CreateAccount';
import MyRecipes from './Components/MyRecipes/MyRecipes';
import SharedRecipes from './Components/SharedRecipes/SharedRecipes';
import RecipeDetails from './Components/RecipeDetails/RecipeDetails';

function App() {
  return (
    <div className="App">
    <Router>
      <Routes>
        <Route path="/my-recipes" element={<MyRecipes />} />
        <Route path="/group-recipes" element={<SharedRecipes />} />
        <Route path="/" element={<LoginSignup />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/recipes" element={<RecipeBoard />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/recipes/:id" element={<RecipeDetails />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App;
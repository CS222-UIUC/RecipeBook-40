import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home/Home';
import LoginSignup from './Components/LoginSignup/LoginSignup';
import RecipeBoard from './Components/Recipes/RecipeBoard';

function App() {
  return (
    <div className="App">
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/recipes" element={<RecipeBoard />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App;
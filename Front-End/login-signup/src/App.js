import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home/Home';
import LoginSignup from './Components/LoginSignup/LoginSignup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<LoginSignup />} />
      </Routes>
    </Router>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home/Home';
import LoginSignup from './Components/LoginSignup/LoginSignup';
import CreateAccount from './Components/CreateAccount/CreateAccount';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/create-account" element={<CreateAccount />} />

      </Routes>
    </Router>
  );
}

export default App;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="home">
      <h1>Welcome to Recipe Book</h1>
      <p>Discover and share amazing recipes from all around the world.</p>
      <button className="login-button" onClick={goToLogin}>Login</button>
    </div>
  );
};

export default Home;
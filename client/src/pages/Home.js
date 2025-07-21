import { useEffect } from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
const Home = () => {
    const navigate = useNavigate();
      useEffect(() => {
        const token = localStorage.getItem('token');
    try {
        if (token) {
          // Redirect to login if no token
          return navigate('/dashboard');
        }
        } catch (error) {
          console.error('Invalid token:', error);
          navigate('/login');
        }
      }, [navigate]);
  return (
    <div className="home-container">
      <div className="home-box">
        <h1 className="home-title">Welcome to Textile Stock System</h1>
        <p className="home-subtitle">
          Manage your inventory with speed, accuracy, and QR-code magic.
        </p>
        <div className="home-buttons">
          <Link to="/login" className="home-btn login-btn">Login</Link>
          <Link to="/signup" className="home-btn signup-btn">Signup</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;

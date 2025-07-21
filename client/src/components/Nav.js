import { Link, useNavigate } from 'react-router-dom';
import './nav.css'; 
const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout?.();
    navigate('/login');
  };

  return (
    <nav className="nav-container">
      <div className="nav-left">
        <Link to="/" className="nav-logo">TextileStock</Link>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About Us</Link>
      </div>

      <div className="nav-right">
        {!userLoggedIn ? (
          <>
            <Link to="/login" className="nav-link nav-link-auth">Login</Link>
            <Link to="/signup" className="nav-link nav-link-auth nav-signup">Sign Up</Link>
          </>
        ) : (
          <button
            className="nav-btn-logout"
            onClick={handleLogout}
            aria-label="Logout"
            type="button"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

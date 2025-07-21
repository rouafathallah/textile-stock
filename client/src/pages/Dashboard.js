import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import axios from 'axios';
import './dashboard.css';

const MAX_SLOTS = 30;

const Dashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [casiers, setCasiers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const decoded = jwtDecode(token);
      if (decoded?.role === 'admin' || decoded?.isAdmin) {
        return navigate('/dashboarda');
      }
      if (!(decoded?.role === 'staff' || decoded?.isStaff)) {
        return navigate('/login');
      }
      fetchCasiers(token);
    } catch (err) {
      console.error('Invalid token:', err);
      navigate('/login');
    }
  }, [navigate]);

  // Fetch casiers from API
  const fetchCasiers = async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/casiers/get', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCasiers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter casiers by search input (starts with)
  const filteredCasiers = casiers.filter((casier) =>
    casier.code_unique.startsWith(search)
  );

  // Navigation handler for floating menu
  const handleNavigate = (path) => {
    setMenuOpen(false);
    if (path === '/dashboard') return; // Stay on same page for casiers
    navigate(path);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dashboard-container">
      {/* Floating star button with dropdown */}
      <div className="floating-menu" ref={menuRef}>
        <button
          className="floating-menu-btn"
          aria-label="Open menu"
          onClick={() => setMenuOpen((prev) => !prev)}
          type="button"
        >
          {/* SVG Star Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="28"
            height="28"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
        {menuOpen && (
          <div className="floating-menu-dropdown" role="menu">
            <button
              onClick={() => handleNavigate('/dashboard/articles')}
              role="menuitem"
              type="button"
            >
              Articles
            </button>
            <button
              onClick={() => handleNavigate('/dashboard')}
              role="menuitem"
              type="button"
            >
              Casiers
            </button>
            <button
              onClick={() => handleNavigate('/dashboard/echantillions')}
              role="menuitem"
              type="button"
            >
              Échantillons
            </button>
          </div>
        )}
      </div>

      <div className="dashboard-card">
        <h1 className="dashboard-title">Staff Dashboard</h1>

        <div className="dashboard-search">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter casier code..."
            className="dashboard-search-input"
            aria-label="Search casier by code"
          />
        </div>

        <h2 className="dashboard-subtitle">Tous les Casiers</h2>
        <div className="dashboard-casiers-list">
          {filteredCasiers.length === 0 ? (
            <p className="dashboard-no-results">Pas de casier trouvé .</p>
          ) : (
            filteredCasiers.map((casier) => (
<div
  key={casier.code_unique}
  className="dashboard-casier-card"
  onClick={() => navigate(`/dashboard/casier/${casier.code_unique}`)}
  style={{ cursor: 'pointer' }}
>
  <div className="dashboard-casier-code">{casier.code_unique}</div>
  <div className="dashboard-casier-espace">
    Espace: {casier.contenus?.length || 0} / {MAX_SLOTS}
  </div>
  <div
    className={
      'dashboard-casier-type ' +
      (casier.type === 'OUT' ? 'type-out' : 'type-in')
    }
  >
    {casier.type}
  </div>
</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

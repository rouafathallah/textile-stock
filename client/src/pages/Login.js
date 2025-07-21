import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import { useEffect } from 'react';
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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


  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Server error. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Login to access your dashboard</p>

        {error && <p className="login-error">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          className="login-input"
          onChange={e => setEmail(e.target.value)}
          required
        />

        <div className="login-password-input">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password-icon"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(prev => !prev); }}
          >
            {showPassword ? '🙈' : '👁️'}
          </span>
        </div>

        <button type="submit" className="login-button">Login</button>

        <p className="login-footer">
          Don't have an account?{' '}
          <span className="login-link" onClick={() => navigate('/signup')}>Sign up</span>
        </p>
      </form>
    </div>
  );
}

export default Login;

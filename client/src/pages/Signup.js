import  { useState } from 'react';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect } from 'react';
const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    CIN: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: ''
  });
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords don't match");
    }

    try {
      const { confirmPassword, ...payload } = formData;
      const res = await axios.post('http://localhost:5000/user/signup', payload);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create a Staff Account</h2>
<form onSubmit={handleSubmit}>
  <input type="text" name="fullName" placeholder="Full Name" required onChange={handleChange} />
  <input type="text" name="CIN" placeholder="CIN" required onChange={handleChange} />
  <input type="email" name="email" placeholder="Email" required onChange={handleChange} />

  <div className="password-input">
    <input
      type={showPassword ? 'text' : 'password'}
      name="password"
      placeholder="Password"
      required
      onChange={handleChange}
    />
    <span onClick={() => setShowPassword(prev => !prev)}>
      {showPassword ? '🙈' : '👁️'}
    </span>
  </div>

  <div className="password-input">
    <input
      type={showConfirmPassword ? 'text' : 'password'}
      name="confirmPassword"
      placeholder="Confirm Password"
      required
      onChange={handleChange}
    />
    <span onClick={() => setShowConfirmPassword(prev => !prev)}>
      {showConfirmPassword ? '🙈' : '👁️'}
    </span>
  </div>

  <input type="date" name="dateOfBirth" required onChange={handleChange} />
  <button type="submit">Sign Up</button>
</form>

        {error && <p className="signup-error">{error}</p>}
        {success && <p className="signup-success">{success}</p>}
      </div>
    </div>
  );
};

export default Signup;

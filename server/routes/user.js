const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const JWT_SECRET = 'roua2904'; // Replace with env var in production

// Signup - create staff user with isVerified false by default
router.post('/signup', async (req, res) => {
  try {
    const { fullName, CIN, email, password, dateOfBirth } = req.body;

    if (!fullName || !CIN || !email || !password || !dateOfBirth) {
      return res.status(400).json({ message: 'All fields are required: fullName, CIN, email, password, dateOfBirth' });
    }

    // Check for existing email or CIN
    if (await User.findOne({ $or: [{ email }, { CIN }] })) {
      return res.status(409).json({ message: 'Email or CIN already registered.' });
    }

    const newUser = new User({
      fullName,
      CIN,
      email,
      password,
      dateOfBirth,
      role: 'staff',      // default role
      isVerified: false   // default unverified
    });

    await newUser.save();

    res.status(201).json({
      message: 'Staff user created successfully. Please wait for verification.',
      user: {
        fullName: newUser.fullName,
        email: newUser.email,
        CIN: newUser.CIN,
        dateOfBirth: newUser.dateOfBirth,
        role: newUser.role,
        isVerified: newUser.isVerified
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login - only verified users allowed
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please contact admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// GET all users
 router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Select the proper fields consistent with model
    const users = await User.find({}, 'fullName email role isVerified CIN');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH update user (admin only): verify user or change role
router.patch('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { role, isVerified } = req.body;
    const updates = {};

    if (role && ['admin', 'staff'].includes(role)) {
      updates.role = role;
    }
    if (typeof isVerified === 'boolean') {
      updates.isVerified = isVerified;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, select: 'fullName email role isVerified' }
    );

    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'User updated.', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
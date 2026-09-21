const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { ValidationError, AuthenticationError, DuplicateEmailError } = require('../utils/errors');

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ValidationError('Please fill all fields');
    }
    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new DuplicateEmailError();
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Please provide email and password');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new AuthenticationError();

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AuthenticationError();

    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  })
);

// GET /api/auth/me — protected
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

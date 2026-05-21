const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

async function createUserId(name) {
  return User.generateUniqueUserId(name);
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, userId: user.userId || user._id.toString(), email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUserPayload(user) {
  const id = user.userId || user._id.toString();
  return {
    id,
    userId: id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email is already registered.' });
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user);

  res.status(201).json({
    token,
    user: safeUserPayload(user),
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (!user.userId) {
    user.userId = await createUserId(user.name);
    await user.save();
  }

  const token = signToken(user);
  res.json({
    token,
    user: safeUserPayload(user),
  });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (!user.userId) {
    user.userId = await createUserId(user.name);
    await user.save();
  }

  res.json({ user: safeUserPayload(user) });
});

module.exports = router;

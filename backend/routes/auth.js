const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock user database
let users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@smartjfb.com',
    password: '$2a$10$9c6UvYTyCXfEMvt5fXo9kedBg3C7Q/Z0yqCQZbgYvSdxR8sKFoN2O', // 'password123' hashed
    role: 'admin',
    createdAt: new Date()
  },
  {
    id: 2,
    username: 'operator',
    email: 'operator@smartjfb.com',
    password: '$2a$10$9c6UvYTyCXfEMvt5fXo9kedBg3C7Q/Z0yqCQZbgYvSdxR8sKFoN2O', // 'password123' hashed
    role: 'operator',
    createdAt: new Date()
  }
];

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Find user
  const user = users.find(u => u.username === username || u.email === username);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'smartjfb_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

// Register new user
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.username === username || u.email === email);
  
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user
  const newUser = {
    id: users.length + 1,
    username,
    email,
    password: hashedPassword,
    role: role || 'operator', // Default role is operator
    createdAt: new Date()
  };

  users.push(newUser);

  // Generate JWT token
  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, role: newUser.role },
    process.env.JWT_SECRET || 'smartjfb_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// Change password
router.put('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.headers['user-id']; // In real app, this would come from JWT middleware

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'User ID, current password, and new password are required' });
  }

  const user = users.find(u => u.id == userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isCurrentPasswordValid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  // Hash new password
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  user.password = hashedNewPassword;

  res.json({
    message: 'Password changed successfully'
  });
});

// Forgot password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = users.find(u => u.email === email);
  
  if (!user) {
    // For security, we don't reveal if email exists
    return res.json({
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // In a real implementation, we would send a password reset email
  // For now, we'll just return a success message
  console.log(`Password reset requested for ${email}. In a real app, an email would be sent.`);

  res.json({
    message: 'If an account with that email exists, a password reset link has been sent'
  });
});

// Get user profile
router.get('/profile', (req, res) => {
  const userId = req.headers['user-id']; // In real app, this would come from JWT middleware

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  const user = users.find(u => u.id == userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

// Update user profile
router.put('/profile', (req, res) => {
  const userId = req.headers['user-id']; // In real app, this would come from JWT middleware
  const { email, username } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  const user = users.find(u => u.id == userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update fields if provided
  if (email) {
    // Check if email is already taken by another user
    const existingUser = users.find(u => u.email === email && u.id != userId);
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already in use' });
    }
    user.email = email;
  }

  if (username) {
    // Check if username is already taken by another user
    const existingUser = users.find(u => u.username === username && u.id != userId);
    if (existingUser) {
      return res.status(409).json({ error: 'Username is already in use' });
    }
    user.username = username;
  }

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

// Middleware to verify JWT token (would be used in other routes)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'smartjfb_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
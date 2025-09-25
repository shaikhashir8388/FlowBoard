const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { registerUser, loginUser } = require('../controllers/authController');
const { getCurrentUser, getAllUsers } = require('../controllers/userController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], loginUser);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getCurrentUser);

// @route   GET /api/auth/users
// @desc    Get all users (for task assignment)
// @access  Private
router.get('/users', auth, getAllUsers);

module.exports = router;

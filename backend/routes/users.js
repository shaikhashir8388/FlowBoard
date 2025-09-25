const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
  getUserById,
  updateUserProfile,
  changePassword,
  searchUsers
} = require('../controllers/userController');

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search users by username or email
// @access  Private
router.get('/search', auth, searchUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, getUserById);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email')
], updateUserProfile);

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], changePassword);

module.exports = router;

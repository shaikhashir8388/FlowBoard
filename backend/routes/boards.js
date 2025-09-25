const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
  getAllBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
  removeBoardMember
} = require('../controllers/boardController');

const router = express.Router();

// @route   GET /api/boards
// @desc    Get all boards for the authenticated user
// @access  Private
router.get('/', auth, getAllBoards);

// @route   GET /api/boards/:id
// @desc    Get a specific board
// @access  Private
router.get('/:id', auth, getBoardById);

// @route   POST /api/boards
// @desc    Create a new board
// @access  Private
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], createBoard);

// @route   PUT /api/boards/:id
// @desc    Update a board
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().notEmpty().withMessage('Title cannot be empty').isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], updateBoard);

// @route   DELETE /api/boards/:id
// @desc    Delete a board
// @access  Private
router.delete('/:id', auth, deleteBoard);

// @route   POST /api/boards/:id/members
// @desc    Add a member to a board
// @access  Private
router.post('/:id/members', [
  auth,
  body('userId').notEmpty().withMessage('User ID is required')
], addBoardMember);

// @route   DELETE /api/boards/:id/members/:userId
// @desc    Remove a member from a board
// @access  Private
router.delete('/:id/members/:userId', auth, removeBoardMember);

module.exports = router;

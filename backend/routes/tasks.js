const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
  getTasksByBoard,
  getTaskById,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getMyTasks
} = require('../controllers/taskController');

const router = express.Router();

// @route   GET /api/tasks/board/:boardId
// @desc    Get all tasks for a specific board
// @access  Private
router.get('/board/:boardId', auth, getTasksByBoard);

// Add route for getting all tasks assigned to the current user
router.get('/my-tasks', auth, getMyTasks);

// @route   GET /api/tasks/:id
// @desc    Get a specific task
// @access  Private
router.get('/:id', auth, getTaskById);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('board').notEmpty().withMessage('Board ID is required'),
  body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
], createTask);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
], updateTask);

// @route   PUT /api/tasks/:id/move
// @desc    Move a task to a different status/position
// @access  Private
router.put('/:id/move', [
  auth,
  body('status').isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('position').isNumeric().withMessage('Position must be a number')
], moveTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, deleteTask);

module.exports = router;

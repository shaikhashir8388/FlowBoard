const { validationResult } = require('express-validator');
const Board = require('../models/Board');
const Task = require('../models/Task');

// Helper function to check board access
const checkBoardAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return false;
  
  return board.owner.toString() === userId.toString() ||
         board.members.includes(userId) ||
         board.isPublic;
};

// @desc    Get all boards for the authenticated user
// @access  Private
const getAllBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    }).populate('owner', 'username email').populate('members', 'username email').sort({ createdAt: -1 });

    res.json(boards);
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a specific board
// @access  Private
const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members', 'username email');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user has access to this board
    const hasAccess = board.owner._id.toString() === req.user._id.toString() ||
                     board.members.some(member => member._id.toString() === req.user._id.toString()) ||
                     board.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(board);
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new board
// @access  Private
const createBoard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, isPublic } = req.body;

    const board = new Board({
      title,
      description,
      owner: req.user._id,
      members: [req.user._id], // Owner is automatically a member
      isPublic: isPublic || false
    });

    await board.save();
    await board.populate('owner', 'username email');
    await board.populate('members', 'username email');

    res.status(201).json(board);
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a board
// @access  Private
const updateBoard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the owner
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only board owner can update.' });
    }

    const { title, description, isPublic } = req.body;

    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    if (isPublic !== undefined) board.isPublic = isPublic;

    await board.save();
    await board.populate('owner', 'username email');
    await board.populate('members', 'username email');

    res.json(board);
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a board
// @access  Private
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the owner
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only board owner can delete.' });
    }

    // Delete all tasks associated with this board
    await Task.deleteMany({ board: req.params.id });

    // Delete the board
    await Board.findByIdAndDelete(req.params.id);

    res.json({ message: 'Board and associated tasks deleted successfully' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a member to a board
// @access  Private
const addBoardMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the owner
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only board owner can add members.' });
    }

    const { userId } = req.body;

    // Check if user is already a member
    if (board.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this board' });
    }

    board.members.push(userId);
    await board.save();
    await board.populate('owner', 'username email');
    await board.populate('members', 'username email');

    res.json(board);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove a member from a board
// @access  Private
const removeBoardMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the owner
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Only board owner can remove members.' });
    }

    // Cannot remove the owner
    if (req.params.userId === board.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove board owner' });
    }

    board.members = board.members.filter(member => member.toString() !== req.params.userId);
    await board.save();
    await board.populate('owner', 'username email');
    await board.populate('members', 'username email');

    res.json(board);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  checkBoardAccess,
  getAllBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
  removeBoardMember
};

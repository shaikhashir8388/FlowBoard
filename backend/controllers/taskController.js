const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const { checkBoardAccess } = require('./boardController');

// @desc    Get all tasks for a specific board
// @access  Private
const getTasksByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { status, assignedTo, search } = req.query;

    // Check if user has access to this board
    const hasAccess = await checkBoardAccess(boardId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build query
    let query = { board: boardId };
    
    if (status) {
      query.status = status;
    }
    
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .sort({ position: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a specific task
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .populate('board', 'title');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this board
    const hasAccess = await checkBoardAccess(task.board._id, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new task
// @access  Private
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, board, status, assignedTo, priority, dueDate, tags } = req.body;

    // Check if user has access to this board
    const hasAccess = await checkBoardAccess(board, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the highest position for the status column
    const maxPositionTask = await Task.findOne({ board, status: status || 'todo' }).sort({ position: -1 });
    const position = maxPositionTask ? maxPositionTask.position + 1 : 0;

    const task = new Task({
      title,
      description,
      board,
      status: status || 'todo',
      assignedTo,
      createdBy: req.user._id,
      priority: priority || 'medium',
      dueDate,
      tags: tags || [],
      position
    });

    await task.save();
    await task.populate('assignedTo', 'username email');
    await task.populate('createdBy', 'username email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(board).emit('task-created', task);

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a task
// @access  Private
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id).populate('board');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this board
    const hasAccess = await checkBoardAccess(task.board._id, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status, assignedTo, priority, dueDate, tags, position } = req.body;

    // If status is changing, update position
    if (status && status !== task.status) {
      const maxPositionTask = await Task.findOne({ board: task.board._id, status }).sort({ position: -1 });
      task.position = maxPositionTask ? maxPositionTask.position + 1 : 0;
    } else if (position !== undefined) {
      task.position = position;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;

    await task.save();
    await task.populate('assignedTo', 'username email');
    await task.populate('createdBy', 'username email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.board._id.toString()).emit('task-updated', task);

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Move a task to a different status/position
// @access  Private
const moveTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id).populate('board');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this board
    const hasAccess = await checkBoardAccess(task.board._id, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, position } = req.body;
    const oldStatus = task.status;
    const oldPosition = task.position;

    // Update task status and position
    task.status = status;
    task.position = position;
    await task.save();

    // Reorder other tasks
    if (oldStatus === status) {
      // Moving within the same column
      if (position < oldPosition) {
        // Moving up - increment positions of tasks between new and old position
        await Task.updateMany({
          board: task.board._id,
          status,
          position: { $gte: position, $lt: oldPosition },
          _id: { $ne: task._id }
        }, { $inc: { position: 1 } });
      } else {
        // Moving down - decrement positions of tasks between old and new position
        await Task.updateMany({
          board: task.board._id,
          status,
          position: { $gt: oldPosition, $lte: position },
          _id: { $ne: task._id }
        }, { $inc: { position: -1 } });
      }
    } else {
      // Moving to a different column
      // Decrement positions in old column
      await Task.updateMany({
        board: task.board._id,
        status: oldStatus,
        position: { $gt: oldPosition }
      }, { $inc: { position: -1 } });

      // Increment positions in new column
      await Task.updateMany({
        board: task.board._id,
        status,
        position: { $gte: position },
        _id: { $ne: task._id }
      }, { $inc: { position: 1 } });
    }

    await task.populate('assignedTo', 'username email');
    await task.populate('createdBy', 'username email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.board._id.toString()).emit('task-updated', task);

    res.json(task);
  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a task
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('board');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this board
    const hasAccess = await checkBoardAccess(task.board._id, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const boardId = task.board._id.toString();
    const taskStatus = task.status;
    const taskPosition = task.position;

    await Task.findByIdAndDelete(req.params.id);

    // Reorder remaining tasks
    await Task.updateMany({
      board: task.board._id,
      status: taskStatus,
      position: { $gt: taskPosition }
    }, { $inc: { position: -1 } });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(boardId).emit('task-deleted', { taskId: req.params.id, boardId });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all tasks assigned to the current user
// @access  Private
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('board', 'title')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTasksByBoard,
  getTaskById,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getMyTasks
};

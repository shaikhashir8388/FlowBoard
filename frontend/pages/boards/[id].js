import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import Layout from '../../components/Layout';
import KanbanBoard from '../../components/KanbanBoard';
import { boardsAPI, tasksAPI, authAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

const BoardPage = () => {
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const router = useRouter();
  const { id: boardId } = router.query;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { socket, joinBoard, leaveBoard } = useSocket();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (boardId && isAuthenticated) {``
      fetchBoard();
      fetchTasks();
      fetchAllUsers();
      
      // Join board for real-time updates
      if (socket) {
        joinBoard(boardId);
      }
    }

    return () => {
      if (boardId && socket) {
        leaveBoard(boardId);
      }
    };
  }, [boardId, isAuthenticated, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (task) => {
      // Check if task already exists to prevent duplicates from socket events
      setTasks(prev => {
        const taskExists = prev.some(existingTask => existingTask._id === task._id);
        if (taskExists) {
          console.log('Task already exists, skipping socket addition');
          return prev;
        }
        console.log('Adding task from socket event');
        toast.success('New task added by team member!');
        return [...prev, task];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks(prev => prev.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      ));
    };

    const handleTaskDeleted = (data) => {
      setTasks(prev => prev.filter(task => task._id !== data.taskId));
      toast.success('Task deleted by team member!');
    };

    socket.on('task-created', handleTaskCreated);
    socket.on('task-updated', handleTaskUpdated);
    socket.on('task-deleted', handleTaskDeleted);

    return () => {
      socket.off('task-created', handleTaskCreated);
      socket.off('task-updated', handleTaskUpdated);
      socket.off('task-deleted', handleTaskDeleted);
    };
  }, [socket]);

  const fetchBoard = async () => {
    try {
      const response = await boardsAPI.getById(boardId);
      setBoard(response.data);
    } catch (error) {
      toast.error('Failed to fetch board');
      router.push('/dashboard');
    }
  };

  const fetchTasks = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterAssignee) params.assignedTo = filterAssignee;

      const response = await tasksAPI.getByBoard(boardId, params);
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setAllUsers(response.data);
      console.log('Fetched all users:', response.data.length);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users for assignment');
    }
  };

  useEffect(() => {
    if (boardId && isAuthenticated) {
      const debounceTimer = setTimeout(() => {
        fetchTasks();
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, filterAssignee, boardId, isAuthenticated]);

  const handleTaskCreate = async (taskData) => {
    console.log('handleTaskCreate called with:', taskData);
    
    // Add a small delay to prevent rapid duplicate submissions
    const now = Date.now();
    if (window.lastTaskCreation && (now - window.lastTaskCreation) < 1000) {
      console.log('Preventing rapid duplicate task creation');
      return;
    }
    window.lastTaskCreation = now;
    
    try {
      const response = await tasksAPI.create({
        ...taskData,
        board: boardId
      });
      
      console.log('Task created on backend:', response.data._id);
      
      // Add task to local state immediately (don't wait for socket event)
      setTasks(prev => {
        const taskExists = prev.some(task => task._id === response.data._id);
        if (taskExists) {
          console.log('Task already exists in state, skipping addition');
          return prev;
        }
        console.log('Adding newly created task to state');
        return [...prev, response.data];
      });
      
      toast.success('Task created successfully!');
    } catch (error) {
      console.error('Task creation error:', error);
      toast.error('Failed to create task');
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const response = await tasksAPI.update(taskId, updates);
      setTasks(prev => prev.map(task => 
        task._id === taskId ? response.data : task
      ));
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleTaskMove = async (taskId, newStatus, newPosition) => {
    try {
      const response = await tasksAPI.move(taskId, {
        status: newStatus,
        position: newPosition
      });
      setTasks(prev => prev.map(task => 
        task._id === taskId ? response.data : task
      ));
    } catch (error) {
      toast.error('Failed to move task');
      // Refresh tasks to restore correct state
      fetchTasks();
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      setTasks(prev => prev.filter(task => task._id !== taskId));
      toast.success('Task deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Board not found</h1>
          <p className="mt-2 text-gray-600">The board you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
            {board.description && (
              <p className="mt-1 text-sm text-gray-600">{board.description}</p>
            )}
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full sm:w-64"
            />
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="input-field w-full sm:w-48"
            >
              <option value="">All Assignees</option>
              {allUsers.map(user => (
                <option key={user._id} value={user._id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Kanban Board */}
        <KanbanBoard
          tasks={tasks}
          board={board}
          allUsers={allUsers}
          onTaskCreate={handleTaskCreate}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          onTaskMove={handleTaskMove}
        />
      </div>
    </Layout>
  );
};

export default BoardPage;

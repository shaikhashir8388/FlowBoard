import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { tasksAPI } from '../utils/api';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast'; 
 
const MyTasks = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyTasks();
    }
  }, [isAuthenticated]);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.getMyTasks();
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch your tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTask = async (task) => {
    try {
      // Fetch latest details for the task
      const { data } = await tasksAPI.getById(task._id);
      setSelectedTask(data);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load task');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = async (formData) => {
    if (!selectedTask) return;
    try {
      const { data } = await tasksAPI.update(selectedTask._id, formData);
      // Update in local list
      setTasks(prev => prev.map(t => (t._id === data._id ? data : t)));
      toast.success('Task updated');
      handleCloseModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task';
      toast.error(message);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await tasksAPI.delete(selectedTask._id);
      setTasks(prev => prev.filter(t => t._id !== selectedTask._id));
      toast.success('Task deleted');
      handleCloseModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete task';
      toast.error(message);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Tasks</h1>
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned to you.</h3>
            <p className="text-gray-500 mb-4">Tasks assigned to you will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} onEdit={handleOpenTask} />
            ))}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleUpdateTask}
        onDelete={handleDeleteTask}
        task={selectedTask}
        mode="edit"
        boardMembers={[]}
      />
    </Layout>
  );
};

export default MyTasks;

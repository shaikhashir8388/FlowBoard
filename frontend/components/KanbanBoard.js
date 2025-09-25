import { useState } from 'react';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' }
];

const KanbanBoard = ({ 
  tasks, 
  board, 
  allUsers,
  onTaskCreate, 
  onTaskUpdate, 
  onTaskDelete,
  onTaskMove
}) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [targetColumn, setTargetColumn] = useState('todo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks
      .filter(task => task.status === column.id)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {});


  const handleCreateTask = (columnId) => {
    setModalMode('create');
    setTargetColumn(columnId);
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    console.log('Opening edit modal for task:', task._id);
    setModalMode('edit');
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (taskData) => {
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    setIsSubmitting(true);
    console.log('handleTaskSubmit called, mode:', modalMode, 'data:', taskData);
    
    try {
      if (modalMode === 'create') {
        await onTaskCreate({
          ...taskData,
          status: targetColumn
        });
      } else {
        await onTaskUpdate(selectedTask._id, taskData);
      }
      setShowTaskModal(false);
    } catch (error) {
      console.error('Task submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      onTaskDelete(taskId);
      setShowTaskModal(false);
    }
  };

  const handleDrop = (taskId, newStatus, targetPosition) => {
    if (!onTaskMove) return;
    onTaskMove(taskId, newStatus, targetPosition);
  };

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
            onCreateTask={() => handleCreateTask(column.id)}
            onEditTask={handleEditTask}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleTaskSubmit}
          onDelete={selectedTask ? () => handleDeleteTask(selectedTask._id) : undefined}
          task={selectedTask}
          mode={modalMode}
          boardMembers={allUsers || board.members}
        />
      )}
    </div>
  );
};

export default KanbanBoard;

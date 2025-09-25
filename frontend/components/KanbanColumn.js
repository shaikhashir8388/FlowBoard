import TaskCard from './TaskCard';

const KanbanColumn = ({ column, tasks, onCreateTask, onEditTask, onDrop }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    try {
      const payload = JSON.parse(data);
      // Drop at end of the column by default
      const targetPosition = tasks.length;
      onDrop && onDrop(payload.taskId, column.id, targetPosition);
    } catch {}
  };

  return (
    <div className={`kanban-column ${column.color}`} onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="font-semibold text-gray-800">{column.title}</h3>
          <span className="ml-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onCreateTask}
          className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-white/50 transition-colors"
          title="Add new task"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Tasks */}
      <div className="space-y-3 min-h-32">
        {tasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={onEditTask}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No tasks</p>
            <button
              onClick={onCreateTask}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium mt-1"
            >
              Add your first task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;

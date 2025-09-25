import { useState } from 'react';
import TaskModal from './TaskModal';

const TaskCard = ({ task, onEdit }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const handleCardClick = () => {
    console.log('Card clicked for task:', task._id);
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDragStart = (e) => {
    const payload = { taskId: task._id, fromStatus: task.status, fromPosition: task.position };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="task-card hover:shadow-md cursor-pointer transition-shadow duration-200"
      onClick={handleCardClick}
      draggable
      onDragStart={handleDragStart}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1 pr-2">
          {task.title}
        </h4>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Task Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {/* Assigned User */}
          {task.assignedTo && task.assignedTo.username ? (
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-800 font-medium text-xs">
                  {task.assignedTo.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="ml-1 truncate max-w-20">
                {task.assignedTo.username}
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-800 font-medium text-xs">N/A</span>
              </div>
              <span className="ml-1 truncate max-w-20">Unassigned</span>
            </div>
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center ${isOverdue(task.dueDate) ? 'text-red-600' : ''}`}>
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={isOverdue(task.dueDate) ? 'font-medium' : ''}>
              {formatDate(task.dueDate)}
            </span>
          </div>
        )}
      </div>

      {/* Created by info */}
      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
        <span>Created by {task.createdBy?.username || 'Unknown'}</span>
        <span className="text-primary-600 opacity-70">Click to edit</span>
      </div>
    </div>
  );
};

export default TaskCard;
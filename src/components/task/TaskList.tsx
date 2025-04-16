import React from 'react';
import { Task } from '../../types';
import TaskCard from './TaskCard';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: any) => void;
  showDetails?: boolean;
  ownership?: 'self' | 'friend';
  compact?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks,
  onStatusChange,
  showDetails = false,
  ownership = 'self',
  compact = false
}) => {
  return (
    <div className={`${styles.taskList} ${compact ? styles.compactList : ''}`}>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          showDetails={showDetails}
          ownership={ownership}
          compact={compact}
        />
      ))}
    </div>
  );
};

export default TaskList; 
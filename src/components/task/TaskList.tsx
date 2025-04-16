import React from 'react';
import { Task } from '../../types';
import TaskCard from './TaskCard';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: any) => void;
  showDetails?: boolean;
  ownership?: 'self' | 'friend';
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks,
  onStatusChange,
  showDetails = false,
  ownership = 'self'
}) => {
  return (
    <div className={styles.taskList}>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          showDetails={showDetails}
          ownership={ownership}
        />
      ))}
    </div>
  );
};

export default TaskList; 
import React from 'react';
import { Task, TaskStatus, SubmissionType } from '../../types';
import TaskCard from './TaskCard';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onSubmissionTypeChange?: (taskId: string, newType: SubmissionType) => void;
  onSubmissionContentChange?: (taskId: string, content: string) => void;
  showDetails?: boolean;
  ownership?: 'self' | 'friend';
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks,
  onStatusChange,
  onSubmissionTypeChange,
  onSubmissionContentChange,
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
          onSubmissionTypeChange={onSubmissionTypeChange}
          onSubmissionContentChange={onSubmissionContentChange}
          showDetails={showDetails}
          ownership={ownership}
        />
      ))}
    </div>
  );
};

export default TaskList; 
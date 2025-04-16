import React from 'react';
import styles from './TasksSection.module.css';
import TaskList from '../task/TaskList';
import Button from '../ui/Button';
import { Task, TaskStatus } from '../../types';

interface TasksSectionProps {
  title: string;
  tasks: Task[];
  isLoading: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onAddTask?: () => void;
  emptyMessage?: string;
}

const TasksSection: React.FC<TasksSectionProps> = ({
  title,
  tasks,
  isLoading,
  onStatusChange,
  onAddTask,
  emptyMessage = 'No tasks found'
}) => {
  return (
    <div className={styles.taskSection}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        {onAddTask && (
          <Button variant="primary" size="sm" onClick={onAddTask} className={styles.addTaskButton}>
            Add Task
          </Button>
        )}
      </div>
      
      <div className={styles.tasksBoard}>
        {isLoading ? (
          <div className={styles.loadingSpinner}></div>
        ) : tasks.length > 0 ? (
          <div className={styles.scrollableBoard}>
            <TaskList tasks={tasks} onStatusChange={onStatusChange} />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>{emptyMessage}</p>
            {onAddTask && (
              <Button variant="primary" onClick={onAddTask}>
                Create your first task
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksSection; 
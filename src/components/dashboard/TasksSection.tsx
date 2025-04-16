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
  columnLayout?: boolean;
}

const TasksSection: React.FC<TasksSectionProps> = ({
  title,
  tasks,
  isLoading,
  onStatusChange,
  onAddTask,
  emptyMessage = 'No tasks found',
  columnLayout = true
}) => {
  return (
    <div className={columnLayout ? styles.taskColumn : styles.taskSection}>
      <div className={styles.sectionHeader}>
        <h2 className={columnLayout ? styles.taskColumnTitle : ''}>{title}</h2>
        {onAddTask && (
          <Button variant="primary" size="sm" onClick={onAddTask} className={styles.addTaskButton}>
            Add Task
          </Button>
        )}
      </div>
      
      <div className={columnLayout ? styles.taskColumnBoard : styles.tasksBoard}>
        {isLoading ? (
          <div className={styles.loadingSpinner}></div>
        ) : tasks.length > 0 ? (
          <div className={styles.scrollableBoard}>
            <TaskList tasks={tasks} onStatusChange={onStatusChange} />
            {onAddTask && columnLayout && (
              <div 
                className={styles.addTaskCard}
                onClick={onAddTask}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Add New Task
              </div>
            )}
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
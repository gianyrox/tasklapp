'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import TaskList from '../../components/task/TaskList';
import { TaskStatus, Friendship, FriendshipStatus, Task, LeaderboardEntry } from '../../types';
import styles from './Dashboard.module.css';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Board from '../../components/ui/Board';
import Button from '../../components/ui/Button';
import CreateTaskModal from '../../components/task/CreateTaskModal';
import { 
  getFriendships, 
  getTasksFromFriends, 
  getTasksByFriend, 
  updateTaskStatus, 
  createTask,
  supabase,
  getTaskById
} from '../../lib/api/supabase';
import { getLeaderboard } from '../../lib/api/supabase';
import { useRouter } from 'next/navigation';

// Helper function to transform task data from Supabase format to our app format
const transformTaskFromDb = (task: any): Task => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: new Date(task.created_at),
    dueDate: new Date(task.due_date),
    assignerId: task.assigner_id,
    assigneeId: task.assignee_id,
    status: task.status as TaskStatus,
    priority: task.priority,
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
    estimatedTimeMinutes: task.estimated_time_minutes,
    actualTimeMinutes: task.actual_time_minutes,
    submissionDate: task.submission_date ? new Date(task.submission_date) : undefined,
    qualityRating: task.quality_rating,
    feedback: task.feedback,
    attachments: task.attachments ? task.attachments.map((attachment: any) => ({
      id: attachment.id,
      taskId: attachment.task_id,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type,
      fileName: attachment.file_name,
      createdAt: new Date(attachment.created_at)
    })) : [],
    assigner: task.assigner ? {
      id: task.assigner.id,
      name: task.assigner.name,
      email: task.assigner.email,
      avatarUrl: task.assigner.avatar_url,
      createdAt: new Date(task.assigner.created_at || Date.now()),
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined,
    assignee: task.assignee ? {
      id: task.assignee.id,
      name: task.assignee.name,
      email: task.assignee.email,
      avatarUrl: task.assignee.avatar_url,
      createdAt: new Date(task.assignee.created_at || Date.now()),
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined
  };
};

// Function to get self-assigned tasks
const getSelfAssignedTasks = async (userId: string): Promise<Task[]> => {
  // Use the Supabase client to get tasks where user is both assignee and assigner
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('assignee_id', userId)
    .eq('assigner_id', userId)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching self-assigned tasks:', error);
    return [];
  }
  
  return data.map(transformTaskFromDb);
};

// Add this function to group and filter tasks
const filterTasksFromFriends = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assigneeId === userId && task.assignerId !== userId);
};

const filterTasksAssignedToOthers = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assignerId === userId && task.assigneeId !== userId);
};

const filterSelfAssignedTasks = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assigneeId === userId && task.assignerId === userId);
};

// Add a function to get all tasks assigned by the user to others
const getTasksAssignedToOthers = async (userId: string): Promise<Task[]> => {
  // Use the Supabase client to get tasks where user is the assigner but not the assignee
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('assigner_id', userId)
    .neq('assignee_id', userId)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching tasks assigned to others:', error);
    return [];
  }
  
  return data.map(transformTaskFromDb);
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendTasks, setFriendTasks] = useState<{[friendId: string]: Task[]}>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [selectedAssigneeName, setSelectedAssigneeName] = useState<string>('');
  const [tasksFromFriends, setTasksFromFriends] = useState<Task[]>([]);
  const [tasksAssignedToOthers, setTasksAssignedToOthers] = useState<Task[]>([]);
  const [selfAssignedTasks, setSelfAssignedTasks] = useState<Task[]>([]);

  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch tasks assigned by friends
      const allTasksFromFriends = await getTasksFromFriends();
      
      // Fetch self-assigned tasks
      const allSelfTasks = await getSelfAssignedTasks(user?.id || '');
      
      // Fetch tasks the user assigned to others
      const assignedToOthers = await getTasksAssignedToOthers(user?.id || '');

      // Combine tasks assigned to current user
      const allMyTasks = [...allTasksFromFriends, ...allSelfTasks];
      setMyTasks(allMyTasks);
      
      // Filter tasks into different categories
      const fromFriends = filterTasksFromFriends(allMyTasks, user?.id || '');
      const selfAssigned = filterSelfAssignedTasks(allMyTasks, user?.id || '');
      
      setTasksFromFriends(fromFriends);
      setTasksAssignedToOthers(assignedToOthers);
      setSelfAssignedTasks(selfAssigned);
      
      // Fetch accepted friendships
      const friendships = await getFriendships(FriendshipStatus.ACCEPTED);
      setFriends(friendships);
      
      // Fetch tasks for each friend
      const tasksByFriend: {[friendId: string]: Task[]} = {};
      for (const friendship of friendships) {
        const friendId = friendship.userId === user?.id ? friendship.friendId : friendship.userId;
        const friendTasks = await getTasksByFriend(friendId);
        tasksByFriend[friendId] = friendTasks;
      }
      setFriendTasks(tasksByFriend);
      
      // Fetch leaderboard data
      const leaderboardData = await getLeaderboard();
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      // Refresh dashboard data after status change
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    }
  };

  const handleAddTask = async () => {
    // Always set this to the current user when adding your own task
    setSelectedAssigneeId(user?.id || '');
    setSelectedAssigneeName('Yourself');
    setShowCreateTaskModal(true);
  };
  
  const handleAddTaskToFriend = (friendId: string, friendName: string) => {
    setSelectedAssigneeId(friendId);
    setSelectedAssigneeName(friendName);
    setShowCreateTaskModal(true);
  };

  const handleTaskCreated = async () => {
    // Refresh task list based on who the task was assigned to
    if (selectedAssigneeId === user?.id) {
      // It was a self-assigned task, need to refresh my tasks
      const tasksFromFriends = await getTasksFromFriends();
      const selfTasks = await getSelfAssignedTasks(user?.id || '');
      const allMyTasks = [...tasksFromFriends, ...selfTasks];
      setMyTasks(allMyTasks);
    } else {
      // It was assigned to a friend
      const updatedFriendTasks = await getTasksByFriend(selectedAssigneeId);
      setFriendTasks(prev => ({
        ...prev,
        [selectedAssigneeId]: updatedFriendTasks
      }));
    }
    
    // Refresh overall dashboard data
    fetchDashboardData();
  };

  // Add Find Friends handler
  const handleFindFriends = () => {
    router.push('/friend');
  };

  // Display error if data loading failed
  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.dashboard}>
            <div className={styles.header}>
              <h1>Dashboard</h1>
              <p className={styles.welcomeMessage}>
                Welcome back, <span className={styles.userName}>{user?.name}</span>
              </p>
            </div>
            <div className={styles.error}>
              <p>{error}</p>
              <Button variant="primary" onClick={fetchDashboardData}>
                Try Again
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  // Quick stats widgets
  const statsWidgets = [
    {
      title: "My Tasks",
      value: myTasks.length,
      description: "Total tasks assigned to you"
    },
    {
      title: "Completed",
      value: myTasks.filter(task => task.status === TaskStatus.COMPLETED).length,
      description: "Tasks you've completed"
    },
    {
      title: "Friends",
      value: friends.length,
      description: "Active connections"
    }
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <p className={styles.welcomeMessage}>
              Welcome back, <span className={styles.userName}>{user?.name}</span>
            </p>
          </div>

          {/* Centered Leaderboard */}
          <div className={styles.centeredLeaderboard}>
            <Board 
              title="Leaderboard" 
              isLoading={isLoading}
              className={styles.leaderboardBoard}
              actionButton={
                <Button size="sm" variant="outline" onClick={() => router.push('/leaderboard')}>View All</Button>
              }
              emptyState={
                <div className={styles.leaderboardEmptyState}>
                  <p>Complete tasks to appear on the leaderboard!</p>
                </div>
              }
            >
              <div className={styles.scrollableBoard}>
                <div className={styles.leaderboardPreview}>
                  {leaderboard.map((entry: any) => (
                    <div key={entry.id} className={`${styles.leaderboardEntry} ${entry.id === user?.id ? styles.currentUser : ''} ${entry.isFriend ? styles.friendUser : ''}`}>
                      <div className={styles.leaderboardRank}>{entry.rank}</div>
                      <div className={styles.leaderboardUser}>
                        {entry.avatarUrl && (
                          <img 
                            src={entry.avatarUrl} 
                            alt={entry.name} 
                            className={styles.leaderboardAvatar} 
                          />
                        )}
                        <span className={styles.leaderboardName}>{entry.name}</span>
                        {entry.id === user?.id && <span className={styles.leaderboardCurrentUser}>(You)</span>}
                      </div>
                      <div className={styles.leaderboardStats}>
                        <div className={styles.leaderboardStat}>
                          <span className={styles.leaderboardStatValue}>{entry.tasksCompleted}</span>
                          <span className={styles.leaderboardStatLabel}>Completed</span>
                        </div>
                        {entry.avgQualityRating && (
                          <div className={styles.leaderboardStat}>
                            <span className={styles.leaderboardStatValue}>{entry.avgQualityRating.toFixed(1)}</span>
                            <span className={styles.leaderboardStatLabel}>Rating</span>
                          </div>
                        )}
                        {entry.avgCompletionTime && (
                          <div className={styles.leaderboardStat}>
                            <span className={styles.leaderboardStatValue}>
                              {entry.avgCompletionTime < 60 
                                ? `${entry.avgCompletionTime}m` 
                                : `${Math.floor(entry.avgCompletionTime/60)}h ${entry.avgCompletionTime%60}m`}
                            </span>
                            <span className={styles.leaderboardStatLabel}>Avg Time</span>
                          </div>
                        )}
                        {entry.tasksOverdue > 0 && (
                          <div className={styles.leaderboardStat}>
                            <span className={styles.leaderboardStatValue}>{entry.tasksOverdue}</span>
                            <span className={styles.leaderboardStatLabel}>Overdue</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Board>
          </div>

          {/* Stats Widgets */}
          <div className={styles.widgetsGrid}>
            {statsWidgets.map((stat, index) => (
              <div key={index} className={styles.statsCard}>
                <h3>{stat.title}</h3>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statDescription}>{stat.description}</div>
              </div>
            ))}
          </div>

          {/* Two-column Task Layout */}
          <div className={styles.tasksColumnsContainer}>
            {/* Column 1: Combined My Tasks and Friends' Tasks */}
            <div className={styles.taskColumn}>
              <h2 className={styles.taskColumnTitle}>My Tasks</h2>
              <Board 
                title="All My Tasks" 
                isLoading={isLoading}
                className={styles.taskColumnBoard}
                emptyState={
                  <div className={styles.emptyState}>
                    <p>You don't have any tasks yet</p>
                    <div 
                      className={styles.addTaskCard}
                      onClick={() => handleAddTask()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Create Your First Task
                    </div>
                  </div>
                }
              >
                <div className={styles.scrollableBoard}>
                  <div>
                    {/* Tasks I created for myself */}
                    {selfAssignedTasks.length > 0 && (
                      <div className={styles.taskSection}>
                        <h3 className={styles.taskSectionTitle}>Tasks I Created</h3>
                        <TaskList tasks={selfAssignedTasks} onStatusChange={handleStatusChange} showDetails={true} ownership="self" />
                      </div>
                    )}
                    
                    {/* Tasks assigned to me by friends */}
                    {tasksFromFriends.length > 0 && (
                      <div className={styles.taskSection}>
                        <h3 className={styles.taskSectionTitle}>Tasks From Friends</h3>
                        <TaskList tasks={tasksFromFriends} onStatusChange={handleStatusChange} showDetails={true} ownership="self" />
                      </div>
                    )}
                    
                    {/* Add Task card */}
                    <div 
                      className={styles.addTaskCard}
                      onClick={() => handleAddTask()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Add New Task
                    </div>
                  </div>
                </div>
              </Board>
            </div>

            {/* Column 2: Task Submission Review */}
            <div className={styles.taskColumn}>
              <h2 className={styles.taskColumnTitle}>Task Submission Review</h2>
              <Board 
                title="Review Completed Tasks" 
                isLoading={isLoading}
                className={styles.taskColumnBoard}
                emptyState={
                  <div className={styles.emptyState}>
                    <p>No completed tasks to review yet</p>
                  </div>
                }
              >
                <div className={styles.scrollableBoard}>
                  <div className={styles.analyticsPlaceholder}>
                    {tasksAssignedToOthers
                      .filter(task => task.status === TaskStatus.COMPLETED && !task.qualityRating)
                      .map(task => (
                        <div key={task.id} className={styles.reviewTask}>
                          <div className={styles.reviewTaskHeader}>
                            <h3>{task.title}</h3>
                            <span className={styles.taskAssignee}>
                              {task.assignee?.name}
                            </span>
                          </div>
                          <div className={styles.reviewTaskDetails}>
                            <p>{task.description}</p>
                            <div className={styles.reviewTaskMeta}>
                              <div>
                                <span className={styles.reviewTaskLabel}>Completed:</span>
                                <span>{task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Unknown'}</span>
                              </div>
                              <div>
                                <span className={styles.reviewTaskLabel}>Due Date:</span>
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.reviewTaskActions}>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => router.push(`/task/${task.id}`)}
                            >
                              Review & Grade
                            </Button>
                          </div>
                        </div>
                      ))}

                    {tasksAssignedToOthers.filter(task => task.status === TaskStatus.COMPLETED && !task.qualityRating).length === 0 && (
                      <div className={styles.emptyReviewState}>
                        <p>No tasks waiting for review</p>
                        <p className={styles.reviewSubtext}>Completed tasks assigned by you will appear here for review</p>
                      </div>
                    )}

                    {/* Recently Graded Tasks */}
                    {tasksAssignedToOthers.filter(task => task.status === TaskStatus.COMPLETED && task.qualityRating).length > 0 && (
                      <div className={styles.gradedTasksSection}>
                        <h3 className={styles.gradedTasksTitle}>Recently Graded</h3>
                        {tasksAssignedToOthers
                          .filter(task => task.status === TaskStatus.COMPLETED && task.qualityRating)
                          .slice(0, 3)
                          .map(task => (
                            <div key={task.id} className={styles.gradedTask}>
                              <div className={styles.gradedTaskTitle}>{task.title}</div>
                              <div className={styles.gradedTaskDetails}>
                                <span className={styles.gradedTaskAssignee}>{task.assignee?.name}</span>
                                <div className={styles.gradedTaskRating}>
                                  <span className={styles.gradedTaskLabel}>Rating:</span>
                                  <span className={styles.gradedTaskValue}>{task.qualityRating}/5</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </Board>
            </div>
          </div>
          
          {/* Friends' Task Lists */}
          <div className={styles.friendsSection}>
            <div className={styles.sectionHeader}>
              <h2>Friends' Task Lists</h2>
              <Button size="sm" variant="primary" onClick={handleFindFriends}>
                Find Friends
              </Button>
            </div>
            {friends.length === 0 && !isLoading ? (
              <div className={styles.emptyState}>
                <p>You haven't connected with any friends yet</p>
                <Button size="sm" variant="primary" onClick={handleFindFriends}>
                  Find Friends
                </Button>
              </div>
            ) : (
              <div className={styles.friendTasksGrid}>
                {friends.map(friendship => {
                  const friendId = friendship.userId === user?.id ? friendship.friendId : friendship.userId;
                  const friendName = friendship.friend?.name || 'Friend';
                  const tasks = friendTasks[friendId] || [];
                  
                  return (
                    <Board 
                      key={friendId}
                      title={`${friendName}'s Tasks`}
                      isLoading={isLoading}
                      emptyState={
                        <div className={styles.emptyState}>
                          <p>You haven't assigned any tasks to {friendName} yet</p>
                          <div 
                            className={styles.addTaskCard}
                            onClick={() => handleAddTaskToFriend(friendId, friendName)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            Assign Task
                          </div>
                        </div>
                      }
                    >
                      <div className={styles.scrollableBoard}>
                        <div>
                          <TaskList tasks={tasks} showDetails={false} ownership="friend" />
                          {tasks.length > 0 && (
                            <div 
                              className={styles.addTaskCard}
                              onClick={() => handleAddTaskToFriend(friendId, friendName)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                              </svg>
                              Assign Task
                            </div>
                          )}
                        </div>
                      </div>
                    </Board>
                  );
                })}
              </div>
            )}
          </div>

          {/* Task Creation Modal */}
          {showCreateTaskModal && (
            <CreateTaskModal
              assigneeId={selectedAssigneeId}
              assigneeName={selectedAssigneeName}
              onClose={() => setShowCreateTaskModal(false)}
              onCreated={handleTaskCreated}
            />
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage; 
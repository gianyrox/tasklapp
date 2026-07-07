/**
 * Pure task filtering + search (feature spec §2.3 US-5).
 *
 * Filters combine with AND. Free-text search matches title and description
 * case-insensitively. Overdue is computed (past due, not COMPLETED/GRADED).
 * Kept dependency-free so the tasks page can filter client-side and so the
 * behavior is unit-testable.
 */
import { Task, TaskStatus, TaskPriority } from '../types';

export type StatusFilter = 'all' | 'active' | TaskStatus;
export type PriorityFilter = 'all' | TaskPriority;

export interface TaskFilterOptions {
  /** Case-insensitive substring match over title + description. */
  search?: string;
  /** 'all', 'active' (PENDING|IN_PROGRESS), 'overdue', or a concrete status. */
  status?: StatusFilter | 'overdue';
  priority?: PriorityFilter;
  assigneeId?: string;
  assignerId?: string;
  /** Only tasks due within this many days from `now` (future window). */
  dueWithinDays?: number;
  now?: Date;
}

/** A task is overdue when it is past due and not yet completed or graded. */
export function isOverdue(task: Task, now: Date = new Date()): boolean {
  return (
    new Date(task.dueDate).getTime() < now.getTime() &&
    task.status !== TaskStatus.COMPLETED &&
    task.status !== TaskStatus.GRADED
  );
}

function isActive(task: Task): boolean {
  return task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS;
}

function matchesSearch(task: Task, term: string): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return (
    task.title.toLowerCase().includes(q) ||
    (task.description ?? '').toLowerCase().includes(q)
  );
}

export function filterTasks(tasks: Task[], options: TaskFilterOptions = {}): Task[] {
  const now = options.now ?? new Date();
  const { search, status, priority, assigneeId, assignerId, dueWithinDays } = options;

  return tasks.filter((task) => {
    if (search && !matchesSearch(task, search)) return false;

    if (status && status !== 'all') {
      if (status === 'active' && !isActive(task)) return false;
      if (status === 'overdue' && !isOverdue(task, now)) return false;
      if (
        status !== 'active' &&
        status !== 'overdue' &&
        task.status !== status
      ) {
        return false;
      }
    }

    if (priority && priority !== 'all' && task.priority !== priority) return false;
    if (assigneeId && task.assigneeId !== assigneeId) return false;
    if (assignerId && task.assignerId !== assignerId) return false;

    if (dueWithinDays != null) {
      const cutoff = now.getTime() + dueWithinDays * 24 * 60 * 60 * 1000;
      const due = new Date(task.dueDate).getTime();
      if (due > cutoff) return false;
    }

    return true;
  });
}

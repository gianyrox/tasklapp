import { describe, it, expect } from 'vitest';
import { filterTasks, isOverdue } from '../taskFilters';
import { Task, TaskStatus, TaskPriority } from '../../types';

const NOW = new Date('2026-07-07T12:00:00Z');

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Write the report',
    description: 'Quarterly numbers',
    createdAt: new Date('2026-07-01'),
    dueDate: new Date('2026-07-10'),
    assignerId: 'alice',
    assigneeId: 'bob',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    ...overrides,
  };
}

describe('isOverdue', () => {
  it('is true when past due and not done', () => {
    expect(isOverdue(task({ dueDate: new Date('2026-07-01'), status: TaskStatus.PENDING }), NOW)).toBe(true);
  });
  it('is false when completed or graded even if past due', () => {
    expect(isOverdue(task({ dueDate: new Date('2026-07-01'), status: TaskStatus.COMPLETED }), NOW)).toBe(false);
    expect(isOverdue(task({ dueDate: new Date('2026-07-01'), status: TaskStatus.GRADED }), NOW)).toBe(false);
  });
});

describe('filterTasks', () => {
  const tasks = [
    task({ title: 'Buy milk', status: TaskStatus.PENDING, priority: TaskPriority.LOW, assigneeId: 'bob' }),
    task({ title: 'Ship release', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.URGENT, assigneeId: 'bob' }),
    task({ title: 'Review PR', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, assigneeId: 'carol' }),
    task({ title: 'Old chore', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, dueDate: new Date('2026-07-01'), assigneeId: 'bob' }),
  ];

  it('returns everything with no options', () => {
    expect(filterTasks(tasks)).toHaveLength(4);
  });

  it('search matches title case-insensitively', () => {
    expect(filterTasks(tasks, { search: 'ship' }).map((t) => t.title)).toEqual(['Ship release']);
  });

  it('search matches description too', () => {
    expect(filterTasks(tasks, { search: 'quarterly' })).toHaveLength(4);
  });

  it('status "active" keeps pending and in-progress', () => {
    expect(filterTasks(tasks, { status: 'active' })).toHaveLength(3);
  });

  it('status "overdue" is computed', () => {
    const overdue = filterTasks(tasks, { status: 'overdue', now: NOW });
    expect(overdue.map((t) => t.title)).toEqual(['Old chore']);
  });

  it('priority filter narrows results', () => {
    expect(filterTasks(tasks, { priority: TaskPriority.URGENT })).toHaveLength(1);
  });

  it('combines filters with AND', () => {
    const res = filterTasks(tasks, { status: 'active', assigneeId: 'bob', priority: TaskPriority.LOW });
    expect(res.map((t) => t.title)).toEqual(['Buy milk']);
  });

  it('dueWithinDays keeps only near-term tasks', () => {
    const res = filterTasks(tasks, { dueWithinDays: 1, now: NOW });
    // Only the overdue "Old chore" (2026-07-01) is within/under the +1 day cutoff
    expect(res.map((t) => t.title)).toEqual(['Old chore']);
  });
});

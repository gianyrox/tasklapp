import { describe, it, expect } from 'vitest';
import { computeRaceTasks, computeCarPosition } from '../raceProgress';
import { Task, TaskStatus, TaskPriority } from '../../types';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Task',
    description: '',
    createdAt: new Date('2026-07-01'),
    dueDate: new Date('2026-07-10'),
    assignerId: 'alice',
    assigneeId: 'bob',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    ...overrides,
  };
}

describe('computeRaceTasks', () => {
  it('returns an empty lap for no tasks', () => {
    expect(computeRaceTasks([])).toEqual([]);
  });

  it('centers a single task', () => {
    const [point] = computeRaceTasks([task()]);
    expect(point.position).toBe(50);
  });

  it('spaces multiple tasks across the track and orders by due date', () => {
    const points = computeRaceTasks([
      task({ id: 'b', dueDate: new Date('2026-07-20') }),
      task({ id: 'a', dueDate: new Date('2026-07-05') }),
    ]);
    expect(points.map((p) => p.id)).toEqual(['a', 'b']);
    expect(points[0].position).toBe(15);
    expect(points[1].position).toBe(85);
  });

  it('marks completed and graded tasks as completed', () => {
    const points = computeRaceTasks([
      task({ id: 'x', status: TaskStatus.GRADED }),
      task({ id: 'y', status: TaskStatus.PENDING }),
    ]);
    expect(points.find((p) => p.id === 'x')!.completed).toBe(true);
    expect(points.find((p) => p.id === 'y')!.completed).toBe(false);
  });

  it('caps the lap at max checkpoints', () => {
    const many = Array.from({ length: 10 }, (_, i) => task({ id: String(i) }));
    expect(computeRaceTasks(many, 6)).toHaveLength(6);
  });
});

describe('computeCarPosition', () => {
  it('sits at the start with no tasks', () => {
    expect(computeCarPosition([])).toBe(10);
  });

  it('advances with completion ratio', () => {
    const tasks = [
      task({ status: TaskStatus.COMPLETED }),
      task({ status: TaskStatus.GRADED }),
      task({ status: TaskStatus.PENDING }),
      task({ status: TaskStatus.IN_PROGRESS }),
    ];
    // 2/4 done -> 10 + 0.5*80 = 50
    expect(computeCarPosition(tasks)).toBe(50);
  });

  it('reaches the finish when all done', () => {
    expect(computeCarPosition([task({ status: TaskStatus.COMPLETED })])).toBe(90);
  });
});

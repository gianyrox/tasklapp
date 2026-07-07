import { describe, it, expect } from 'vitest';
import {
  computeUserMetrics,
  computeCompositeScore,
  isCompleted,
  isPerfect,
  isOnTime,
  decayFactor,
  PERFECT_BONUS,
  NEUTRAL_QUALITY,
  ScoringTask,
} from '../scoring';

const NOW = new Date('2026-07-07T12:00:00Z');

function task(overrides: Partial<ScoringTask> = {}): ScoringTask {
  return {
    status: 'COMPLETED',
    dueDate: '2026-07-05T12:00:00Z',
    completedAt: '2026-07-04T12:00:00Z',
    ...overrides,
  };
}

describe('isCompleted', () => {
  it('counts COMPLETED and GRADED as done', () => {
    expect(isCompleted('COMPLETED')).toBe(true);
    expect(isCompleted('GRADED')).toBe(true);
  });
  it('does not count in-flight statuses', () => {
    expect(isCompleted('PENDING')).toBe(false);
    expect(isCompleted('IN_PROGRESS')).toBe(false);
    expect(isCompleted('OVERDUE')).toBe(false);
  });
});

describe('isPerfect', () => {
  it('requires 5 on all four axes', () => {
    expect(
      isPerfect(task({ qualityRating: 5, timelinessRating: 5, effortRating: 5, accuracyRating: 5 })),
    ).toBe(true);
    expect(
      isPerfect(task({ qualityRating: 5, timelinessRating: 4, effortRating: 5, accuracyRating: 5 })),
    ).toBe(false);
  });
});

describe('isOnTime', () => {
  it('uses dates when available', () => {
    expect(isOnTime(task({ completedAt: '2026-07-04', dueDate: '2026-07-05' }))).toBe(true);
    expect(isOnTime(task({ completedAt: '2026-07-06', dueDate: '2026-07-05' }))).toBe(false);
  });
  it('falls back to timeliness grade', () => {
    expect(isOnTime(task({ completedAt: null, dueDate: null, timelinessRating: 4 }))).toBe(true);
    expect(isOnTime(task({ completedAt: null, dueDate: null, timelinessRating: 2 }))).toBe(false);
  });
});

describe('decayFactor', () => {
  it('is full within the grace window', () => {
    const recent = new Date(NOW.getTime() - 3 * 24 * 3600 * 1000);
    expect(decayFactor(recent, NOW)).toBe(1);
  });
  it('halves after one half-life past grace', () => {
    const stale = new Date(NOW.getTime() - (7 + 14) * 24 * 3600 * 1000);
    expect(decayFactor(stale, NOW)).toBeCloseTo(0.5, 5);
  });
  it('is 1 when there is no activity date', () => {
    expect(decayFactor(null, NOW)).toBe(1);
  });
});

describe('computeCompositeScore', () => {
  it('multiplies completed × quality × on-time and adds perfect bonus', () => {
    const score = computeCompositeScore({
      tasksCompleted: 4,
      avgQualityRating: 4,
      onTimeRate: 0.5,
      perfectTasks: 1,
    });
    // 4 * 4 * 0.5 + 2*1 = 10
    expect(score).toBe(8 + PERFECT_BONUS);
  });
  it('uses a neutral quality factor before any grades exist', () => {
    const score = computeCompositeScore({
      tasksCompleted: 3,
      avgQualityRating: undefined,
      onTimeRate: 1,
      perfectTasks: 0,
    });
    expect(score).toBe(3 * NEUTRAL_QUALITY * 1);
  });
});

describe('computeUserMetrics', () => {
  it('rolls up ratings and keeps graded tasks in the completed count', () => {
    const tasks: ScoringTask[] = [
      task({ status: 'GRADED', qualityRating: 5, timelinessRating: 5, effortRating: 5, accuracyRating: 5, actualTimeMinutes: 30 }),
      task({ status: 'COMPLETED', qualityRating: 3, actualTimeMinutes: 90, completedAt: '2026-07-06', dueDate: '2026-07-05' }),
      task({ status: 'PENDING', completedAt: null, dueDate: '2026-07-01' }), // overdue
    ];
    const m = computeUserMetrics(tasks, NOW);
    expect(m.tasksCompleted).toBe(2);
    expect(m.perfectTasks).toBe(1);
    expect(m.tasksOnTime).toBe(1); // second one is late
    expect(m.tasksOverdue).toBe(1);
    expect(m.fastestCompletionTime).toBe(30);
    expect(m.avgQualityRating).toBe(4); // (5+3)/2
    expect(m.compositeScore).toBeGreaterThan(0);
  });

  it('returns a zero score for a user with no completed tasks', () => {
    const m = computeUserMetrics([task({ status: 'PENDING', completedAt: null, dueDate: '2026-08-01' })], NOW);
    expect(m.tasksCompleted).toBe(0);
    expect(m.compositeScore).toBe(0);
    expect(m.onTimeRate).toBe(0);
  });
});

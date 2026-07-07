/**
 * Leaderboard scoring.
 *
 * Implements the composite score from the TaskLapp feature spec §3.3:
 *
 *   score = completed_tasks × avg_quality × on_time_rate
 *           + PERFECT_BONUS per perfect (5/5 on all axes) task,
 *           with a time decay so stale accounts fall off the board.
 *
 * All functions here are pure so they can be unit-tested without a database.
 * `getLeaderboard()` in `lib/api/supabase.ts` feeds normalized rows into
 * `computeUserMetrics` and reads `compositeScore` back for ranking.
 */

/** Minimal shape a task needs to be scored. Field names mirror the DB rows. */
export interface ScoringTask {
  status: string;
  qualityRating?: number | null;
  timelinessRating?: number | null;
  effortRating?: number | null;
  accuracyRating?: number | null;
  actualTimeMinutes?: number | null;
  dueDate?: string | Date | null;
  completedAt?: string | Date | null;
  submissionDate?: string | Date | null;
}

export interface UserMetrics {
  tasksCompleted: number;
  avgCompletionTime?: number;
  avgQualityRating?: number;
  avgTimelinessRating?: number;
  avgEffortRating?: number;
  avgAccuracyRating?: number;
  tasksOverdue: number;
  perfectTasks: number;
  tasksOnTime: number;
  fastestCompletionTime?: number;
  onTimeRate: number;
  compositeScore: number;
}

/** Bonus points added per perfect (5/5 on all four axes) task. */
export const PERFECT_BONUS = 2;
/**
 * Quality multiplier used before a user has any graded work. Kept at 1.0 so
 * ungraded completions count for something without out-ranking graded work.
 */
export const NEUTRAL_QUALITY = 1.0;
/** Days of inactivity before decay starts biting. */
export const DECAY_GRACE_DAYS = 7;
/** Half-life (in days) of the staleness decay past the grace window. */
export const DECAY_HALFLIFE_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function avg(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** A COMPLETED task and a GRADED task are both "done" — grading must not drop the count. */
export function isCompleted(status: string): boolean {
  return status === 'COMPLETED' || status === 'GRADED';
}

/** True when all four grading axes are a perfect 5. */
export function isPerfect(task: ScoringTask): boolean {
  return (
    task.qualityRating === 5 &&
    task.timelinessRating === 5 &&
    task.effortRating === 5 &&
    task.accuracyRating === 5
  );
}

/**
 * Decide whether a completed task landed on time. Prefer real dates
 * (completion vs due). Fall back to the timeliness grade (>=3 = on time),
 * then to a benefit-of-the-doubt "yes" when nothing is known.
 */
export function isOnTime(task: ScoringTask): boolean {
  const due = toDate(task.dueDate);
  const done = toDate(task.completedAt) ?? toDate(task.submissionDate);
  if (due && done) return done.getTime() <= due.getTime();
  if (task.timelinessRating != null) return task.timelinessRating >= 3;
  return true;
}

/**
 * Time-decay multiplier in (0, 1]. Full credit within the grace window,
 * then halves every DECAY_HALFLIFE_DAYS of further inactivity.
 */
export function decayFactor(lastActivity: Date | null, now: Date): number {
  if (!lastActivity) return 1;
  const daysStale = (now.getTime() - lastActivity.getTime()) / MS_PER_DAY;
  const over = daysStale - DECAY_GRACE_DAYS;
  if (over <= 0) return 1;
  return Math.pow(0.5, over / DECAY_HALFLIFE_DAYS);
}

/**
 * Raw composite score from a set of metrics. Kept separate from
 * `computeUserMetrics` so the formula can be tested and tuned in isolation.
 */
export function computeCompositeScore(
  m: Pick<UserMetrics, 'tasksCompleted' | 'avgQualityRating' | 'onTimeRate' | 'perfectTasks'>,
  decay = 1,
): number {
  const quality = m.avgQualityRating && m.avgQualityRating > 0 ? m.avgQualityRating : NEUTRAL_QUALITY;
  const base = m.tasksCompleted * quality * m.onTimeRate + PERFECT_BONUS * m.perfectTasks;
  return Math.round(base * decay * 100) / 100;
}

/**
 * Roll a user's assignee tasks up into leaderboard metrics + composite score.
 * `now` is injectable so tests are deterministic and the decay is reproducible.
 */
export function computeUserMetrics(tasks: ScoringTask[], now: Date = new Date()): UserMetrics {
  const completed = tasks.filter((t) => isCompleted(t.status));

  const completionTimes = completed
    .map((t) => t.actualTimeMinutes)
    .filter((v): v is number => v != null);

  const qualityRatings = completed
    .map((t) => t.qualityRating)
    .filter((v): v is number => v != null);
  const timelinessRatings = completed
    .map((t) => t.timelinessRating)
    .filter((v): v is number => v != null);
  const effortRatings = completed
    .map((t) => t.effortRating)
    .filter((v): v is number => v != null);
  const accuracyRatings = completed
    .map((t) => t.accuracyRating)
    .filter((v): v is number => v != null);

  const perfectTasks = completed.filter(isPerfect).length;
  const tasksOnTime = completed.filter(isOnTime).length;

  const tasksOverdue = tasks.filter((t) => {
    if (t.status === 'OVERDUE') return true;
    if (isCompleted(t.status)) return false;
    const due = toDate(t.dueDate);
    return due != null && due.getTime() < now.getTime();
  }).length;

  const lastActivity = completed
    .map((t) => toDate(t.completedAt) ?? toDate(t.submissionDate))
    .filter((d): d is Date => d != null)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  const tasksCompleted = completed.length;
  const onTimeRate = tasksCompleted > 0 ? tasksOnTime / tasksCompleted : 0;
  const avgQualityRating = avg(qualityRatings);

  const compositeScore = computeCompositeScore(
    { tasksCompleted, avgQualityRating, onTimeRate, perfectTasks },
    decayFactor(lastActivity, now),
  );

  return {
    tasksCompleted,
    avgCompletionTime: avg(completionTimes),
    avgQualityRating,
    avgTimelinessRating: avg(timelinessRatings),
    avgEffortRating: avg(effortRatings),
    avgAccuracyRating: avg(accuracyRatings),
    tasksOverdue,
    perfectTasks,
    tasksOnTime,
    fastestCompletionTime: completionTimes.length ? Math.min(...completionTimes) : undefined,
    onTimeRate,
    compositeScore,
  };
}

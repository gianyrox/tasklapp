/**
 * Loop instrumentation (feature spec §6).
 *
 * Every state transition in the assign → start → submit → grade loop emits an
 * event stamped with whether it was peer (assigner ≠ assignee) or self. That
 * makes the north-star "weekly graded peer tasks" and the peer:self ratio
 * queryable from day one. Events go to the existing user_logs sink via addLog
 * and, when available, to Vercel Analytics custom events.
 */
import { addLog } from './logging';
import { LogCategory } from '../../confy/types';

export type TaskEventType = 'assign' | 'start' | 'submit' | 'grade';

export interface TaskEventPayload {
  taskId: string;
  assignerId?: string | null;
  assigneeId?: string | null;
  actorId?: string | null;
  extra?: Record<string, string | number | boolean>;
}

/** Peer = one person handed the task to another; self = solo task. */
export function relationOf(assignerId?: string | null, assigneeId?: string | null): 'peer' | 'self' | 'unknown' {
  if (!assignerId || !assigneeId) return 'unknown';
  return assignerId === assigneeId ? 'self' : 'peer';
}

export async function trackTaskEvent(type: TaskEventType, payload: TaskEventPayload): Promise<void> {
  const relation = relationOf(payload.assignerId, payload.assigneeId);
  const isPeer = relation === 'peer';

  const details: Record<string, any> = {
    event: `task_${type}`,
    taskId: payload.taskId,
    relation,
    isPeer,
    ...payload.extra,
  };

  // Fire-and-forget to Vercel Analytics if we're in the browser.
  try {
    if (typeof window !== 'undefined') {
      const { track } = await import('@vercel/analytics');
      track(`task_${type}`, { relation, isPeer });
    }
  } catch {
    // Analytics is best-effort; never block the loop on it.
  }

  await addLog({
    userId: payload.actorId ?? undefined,
    category: LogCategory.TASK,
    action: `task_${type}`,
    details,
  });
}

/**
 * Race-track progress (feature spec §2.4 US-8 / §3.3).
 *
 * Turns a user's tasks into checkpoint flags along the track and a car
 * position that advances as tasks complete. Pure so the RaceTrack component
 * can render real data and the mapping stays unit-testable. The name TaskLapp
 * is "task lap" — completing tasks runs laps.
 */
import { Task, TaskStatus } from '../types';

export interface RaceTaskPoint {
  id: string;
  title: string;
  completed: boolean;
  /** Position along the track, 0–100. */
  position: number;
}

const TRACK_START = 15;
const TRACK_END = 85;

function isDone(task: Task): boolean {
  return task.status === TaskStatus.COMPLETED || task.status === TaskStatus.GRADED;
}

/**
 * Pick the tasks that make up the current lap and space them along the track.
 * Prefers the soonest-due tasks; completed ones stay on the board so the lap
 * reads as progress. Returns at most `max` checkpoints.
 */
export function computeRaceTasks(tasks: Task[], max = 6): RaceTaskPoint[] {
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  const lap = sorted.slice(0, max);
  const span = TRACK_END - TRACK_START;

  return lap.map((task, index) => ({
    id: task.id,
    title: task.title,
    completed: isDone(task),
    position:
      lap.length === 1
        ? (TRACK_START + TRACK_END) / 2
        : Math.round(TRACK_START + (span * index) / (lap.length - 1)),
  }));
}

/**
 * Car position, 10–90, from the completion ratio of the current lap.
 * Empty lap keeps the car at the start line.
 */
export function computeCarPosition(tasks: Task[]): number {
  if (tasks.length === 0) return 10;
  const done = tasks.filter(isDone).length;
  const ratio = done / tasks.length;
  return Math.round(10 + ratio * 80);
}

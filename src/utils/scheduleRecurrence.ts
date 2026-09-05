/**
 * Schedule recurrence helpers
 * Pure date maths for repeating schedules - no services, no side effects.
 */

import {Schedule} from '../types';

export type RecurringPattern = 'daily' | 'weekly' | 'monthly';

// Hour used when a schedule has a date but no time, matching the hour the time
// picker opens on so a date-only schedule still has a sensible reminder moment.
const DEFAULT_HOUR = 9;

// Shortest gap a pattern can produce. Deliberately an under-estimate: it jumps
// most of the way forward, then getNextOccurrenceIndex walks the last step or two.
const MIN_GAP_MS: Record<RecurringPattern, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 28 * 24 * 60 * 60 * 1000,
};

/**
 * Parse a stored time string ("9:30 AM") into 24-hour parts.
 */
export const parseScheduleTime = (
  time?: string,
): {hours: number; minutes: number} | null => {
  if (!time) return null;
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];
  if (period?.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return {hours, minutes};
};

/**
 * The exact moment a schedule is due: its date at its time, or at 9:00 AM when
 * no time was picked.
 */
export const getScheduleDateTime = (schedule: Schedule): Date => {
  const due = new Date(schedule.date);
  const time = parseScheduleTime(schedule.time);
  due.setHours(time ? time.hours : DEFAULT_HOUR, time ? time.minutes : 0, 0, 0);
  return due;
};

/**
 * Move a date forward by whole occurrences. Uses setDate/setMonth rather than
 * millisecond arithmetic so the wall-clock time survives daylight saving, and
 * clamps to month length (31 Jan + 1 month -> 28 Feb, never 3 Mar).
 */
export const addOccurrences = (
  date: Date,
  pattern: RecurringPattern,
  count: number,
): Date => {
  const result = new Date(date.getTime());

  if (pattern === 'daily') {
    result.setDate(result.getDate() + count);
    return result;
  }

  if (pattern === 'weekly') {
    result.setDate(result.getDate() + count * 7);
    return result;
  }

  const dayOfMonth = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + count);
  const daysInMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(dayOfMonth, daysInMonth));
  return result;
};

/**
 * How many occurrences past `due` land strictly after `after`. Every candidate
 * is measured from the original date, so a monthly repeat that was clamped to a
 * short month does not drift on the following months.
 */
export const getNextOccurrenceIndex = (
  due: Date,
  pattern: RecurringPattern,
  after: Date,
): number => {
  if (due.getTime() > after.getTime()) return 0;

  let steps = Math.max(
    0,
    Math.floor((after.getTime() - due.getTime()) / MIN_GAP_MS[pattern]),
  );

  // Guarded so a corrupt stored date can never spin here.
  let guard = 0;
  while (
    addOccurrences(due, pattern, steps).getTime() <= after.getTime() &&
    guard < 500
  ) {
    steps += 1;
    guard += 1;
  }

  return steps;
};

/**
 * The first occurrence strictly after `after`.
 */
export const getNextOccurrence = (
  due: Date,
  pattern: RecurringPattern,
  after: Date,
): Date =>
  addOccurrences(due, pattern, getNextOccurrenceIndex(due, pattern, after));

/**
 * Advance a recurring schedule whose occurrence has passed to its next one.
 * Returns null when nothing needs to change, so callers can skip the write.
 */
export const rollScheduleForward = (
  schedule: Schedule,
  now: Date,
): Schedule | null => {
  if (!schedule.isRecurring || !schedule.recurringPattern) return null;

  const due = getScheduleDateTime(schedule);
  if (due.getTime() > now.getTime()) return null;

  const next = getNextOccurrence(due, schedule.recurringPattern, now);
  return {
    ...schedule,
    date: next.toISOString(),
    // A fresh occurrence starts over, even if the last one was ticked off.
    isCompleted: false,
    updatedAt: new Date().toISOString(),
  };
};

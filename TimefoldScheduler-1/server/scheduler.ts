/**
 * DEPRECATED: This file is no longer used.
 * 
 * The scheduling logic has been replaced with Timefold, an AI constraint satisfaction solver.
 * See server/timefoldClient.ts for the new implementation.
 * 
 * The local greedy and backtracking algorithms below are kept for reference only.
 * They should be removed after confirming Timefold integration is working correctly.
 * 
 * For setup instructions, see TIMEFOLD_SETUP.md
 */

import { type Class, type Course, type Teacher, type StudentGroup } from "@shared/schema";
import { hasTimeOverlap } from "./conflictDetection";

interface SchedulingRequest {
  courseId: string;
  teacherId: string;
  studentGroupId: string;
}

interface ScheduledClass {
  courseId: string;
  teacherId: string;
  studentGroupId: string;
  day: string;
  startTime: string;
  endTime: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

function addHour(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newHours = hours + 1;
  return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function canSchedule(
  proposed: ScheduledClass,
  scheduled: ScheduledClass[]
): boolean {
  for (const existing of scheduled) {
    if (!hasTimeOverlap(proposed, existing)) {
      continue;
    }

    // Check teacher conflict
    if (proposed.teacherId === existing.teacherId) {
      return false;
    }

    // Check student group conflict
    if (proposed.studentGroupId === existing.studentGroupId) {
      return false;
    }
  }

  return true;
}

/**
 * @deprecated Use Timefold solver via timefoldClient.ts instead
 */
export function generateSchedule(requests: SchedulingRequest[]): ScheduledClass[] {
  const scheduled: ScheduledClass[] = [];

  // Sort requests to process them in a consistent order
  const sortedRequests = [...requests];

  for (const request of sortedRequests) {
    let placed = false;

    // Try each day and time slot
    for (const day of DAYS) {
      if (placed) break;

      for (const startTime of TIME_SLOTS) {
        const endTime = addHour(startTime);

        const proposed: ScheduledClass = {
          courseId: request.courseId,
          teacherId: request.teacherId,
          studentGroupId: request.studentGroupId,
          day,
          startTime,
          endTime,
        };

        if (canSchedule(proposed, scheduled)) {
          scheduled.push(proposed);
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      console.warn(`Could not schedule course ${request.courseId} - no available slots`);
    }
  }

  return scheduled;
}

/**
 * @deprecated Use Timefold solver via timefoldClient.ts instead
 */
export function generateScheduleWithBacktracking(
  requests: SchedulingRequest[],
  maxAttempts: number = 1000
): { scheduled: ScheduledClass[]; unscheduled: SchedulingRequest[] } {
  let bestSchedule: ScheduledClass[] = [];
  let bestScore = 0;

  function trySchedule(
    index: number,
    current: ScheduledClass[],
    attempts: number
  ): boolean {
    if (attempts > maxAttempts) {
      return false;
    }

    if (index >= requests.length) {
      if (current.length > bestScore) {
        bestScore = current.length;
        bestSchedule = [...current];
      }
      return current.length === requests.length;
    }

    const request = requests[index];

    // Try each time slot
    for (const day of DAYS) {
      for (const startTime of TIME_SLOTS) {
        const endTime = addHour(startTime);

        const proposed: ScheduledClass = {
          courseId: request.courseId,
          teacherId: request.teacherId,
          studentGroupId: request.studentGroupId,
          day,
          startTime,
          endTime,
        };

        if (canSchedule(proposed, current)) {
          current.push(proposed);

          if (trySchedule(index + 1, current, attempts + 1)) {
            return true;
          }

          current.pop(); // Backtrack
        }
      }
    }

    // Try skipping this request
    if (trySchedule(index + 1, current, attempts + 1)) {
      return true;
    }

    return false;
  }

  trySchedule(0, [], 0);

  const scheduledIds = new Set(bestSchedule.map(s => s.courseId));
  const unscheduled = requests.filter(r => !scheduledIds.has(r.courseId));

  return {
    scheduled: bestSchedule,
    unscheduled,
  };
}

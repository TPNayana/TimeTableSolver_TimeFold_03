import { type Class } from "@shared/schema";

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export function hasTimeOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) {
    return false;
  }

  const start1 = parseTime(slot1.startTime);
  const end1 = parseTime(slot1.endTime);
  const start2 = parseTime(slot2.startTime);
  const end2 = parseTime(slot2.endTime);

  return start1 < end2 && start2 < end1;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export interface ConflictInfo {
  hasConflict: boolean;
  conflicts: Array<{
    type: 'teacher' | 'studentGroup';
    message: string;
    conflictingClassId: string;
  }>;
}

export function detectConflicts(
  newClass: TimeSlot & { teacherId: string; studentGroupId: string; id?: string },
  existingClasses: Class[]
): ConflictInfo {
  const conflicts: ConflictInfo['conflicts'] = [];

  for (const existing of existingClasses) {
    // Skip comparing with itself
    if (newClass.id && existing.id === newClass.id) {
      continue;
    }

    if (!hasTimeOverlap(newClass, existing)) {
      continue;
    }

    // Check teacher conflict
    if (newClass.teacherId === existing.teacherId) {
      conflicts.push({
        type: 'teacher',
        message: `Teacher is already scheduled for another class at this time`,
        conflictingClassId: existing.id,
      });
    }

    // Check student group conflict
    if (newClass.studentGroupId === existing.studentGroupId) {
      conflicts.push({
        type: 'studentGroup',
        message: `Student group is already scheduled for another class at this time`,
        conflictingClassId: existing.id,
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

export interface SuggestedSlot {
  day: string;
  startTime: string;
  endTime: string;
  available: boolean;
  conflicts: string[];
}

export function generateSmartSuggestions(
  teacherId: string,
  studentGroupId: string,
  existingClasses: Class[],
  excludeClassId?: string
): SuggestedSlot[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const suggestions: SuggestedSlot[] = [];

  for (const day of days) {
    for (const time of timeSlots) {
      const endTime = addHour(time);
      
      const proposedSlot = {
        day,
        startTime: time,
        endTime,
        teacherId,
        studentGroupId,
        id: excludeClassId,
      };

      const conflictInfo = detectConflicts(proposedSlot, existingClasses);

      suggestions.push({
        day,
        startTime: time,
        endTime,
        available: !conflictInfo.hasConflict,
        conflicts: conflictInfo.conflicts.map(c => c.message),
      });
    }
  }

  // Sort to show available slots first, then by day and time
  return suggestions.sort((a, b) => {
    if (a.available !== b.available) {
      return a.available ? -1 : 1;
    }
    const dayOrder = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };
    const dayDiff = dayOrder[a.day as keyof typeof dayOrder] - dayOrder[b.day as keyof typeof dayOrder];
    if (dayDiff !== 0) return dayDiff;
    return parseTime(a.startTime) - parseTime(b.startTime);
  }).slice(0, 10); // Return top 10 suggestions
}

function addHour(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newHours = hours + 1;
  return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

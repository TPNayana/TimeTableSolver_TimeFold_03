import type { Class, Teacher, Course, StudentGroup } from "@shared/schema";

interface TimeslotDTO {
  id: string;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
  startTime: string;
  endTime: string;
}

interface LessonDTO {
  id: string;
  subject: string;
  teacher: string;
  studentGroup: string;
  department: string;
  timeslotId: string | null;
}

interface TimefoldRequest {
  timeslots: TimeslotDTO[];
  lessons: LessonDTO[];
}

interface TimefoldResponse {
  lessons: LessonDTO[];
}

const TIMEFOLD_API_URL = process.env.TIMEFOLD_API_URL || "http://localhost:8080";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; // 8 AM to 5 PM

function generateTimeslots(): TimeslotDTO[] {
  const timeslots: TimeslotDTO[] = [];

  for (const day of DAYS) {
    for (const hour of HOURS) {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
      const id = `${day.substring(0, 3)}_${startTime.replace(":", "")}`;

      timeslots.push({
        id,
        dayOfWeek: day,
        startTime,
        endTime,
      });
    }
  }

  return timeslots;
}

interface ClassAssignment {
  courseId: string;
  courseCode: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  studentGroupId: string;
  studentGroupName: string;
  department: string;
}

export async function solveSchedule(
  assignments: ClassAssignment[]
): Promise<Class[]> {
  const timeslots = generateTimeslots();

  const lessons: LessonDTO[] = assignments.map((assignment, index) => ({
    id: `L${index}`,
    subject: assignment.courseName,
    teacher: assignment.teacherName,
    studentGroup: assignment.studentGroupName,
    department: assignment.department,
    timeslotId: null, // To be assigned by solver
  }));

  const request: TimefoldRequest = {
    timeslots,
    lessons,
  };

  console.log("=== TIMEFOLD SOLVER CALLED ===");
  console.log(`Solving schedule for ${assignments.length} lesson(s)`);
  console.log(`Available timeslots: ${timeslots.length}`);

  try {
    const response = await fetch(`${TIMEFOLD_API_URL}/api/schedule/solve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(
        `Timefold solver returned ${response.status}: ${response.statusText}`
      );
    }

    console.log("=== TIMEFOLD SOLVER RESPONSE RECEIVED ===");
    const solvedData: TimefoldResponse = await response.json();

    // Map Timefold response back to Class format
    const result: Class[] = [];

    for (let i = 0; i < solvedData.lessons.length; i++) {
      const lesson = solvedData.lessons[i];
      const assignment = assignments[i];

      if (!lesson.timeslotId) {
        console.warn(
          `Lesson ${lesson.id} was not assigned a timeslot by Timefold`
        );
        continue;
      }

      // Find the timeslot details
      const timeslot = timeslots.find((ts) => ts.id === lesson.timeslotId);
      if (!timeslot) {
        console.warn(
          `Could not find timeslot with ID ${lesson.timeslotId} for lesson ${lesson.id}`
        );
        continue;
      }

      const dayMap: Record<string, string> = {
        MONDAY: "Monday",
        TUESDAY: "Tuesday",
        WEDNESDAY: "Wednesday",
        THURSDAY: "Thursday",
        FRIDAY: "Friday",
      };

      result.push({
        id: `${assignment.courseId}-${assignment.teacherId}-${assignment.studentGroupId}`,
        courseId: assignment.courseId,
        teacherId: assignment.teacherId,
        studentGroupId: assignment.studentGroupId,
        day: dayMap[timeslot.dayOfWeek] || timeslot.dayOfWeek,
        startTime: timeslot.startTime,
        endTime: timeslot.endTime,
        hasConflict: false,
      });
    }

    return result;
  } catch (error) {
    console.error("Error calling Timefold solver:", error);
    throw error;
  }
}

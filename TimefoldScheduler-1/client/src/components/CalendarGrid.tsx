import React from "react";
import { ClassEventCard } from "./ClassEventCard";

interface ClassEvent {
  id: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  studentGroup: string;
  meetingLink?: string;
  day: string;
  startTime: string;
  endTime: string;
  hasConflict?: boolean;
  courseId?: string;
  teacherId?: string;
  studentGroupId?: string;
}

interface CalendarGridProps {
  events?: ClassEvent[];
  onEventClick?: (event: ClassEvent) => void;
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

export const CalendarGrid: React.FC<CalendarGridProps> = ({ events = [], onEventClick }) => {
  // 1. EMPTY STATE: If no events, show the Upload Message
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] border-2 border-dashed rounded-lg bg-muted/20">
        <h3 className="text-xl font-semibold text-muted-foreground">
          Please upload a file to view the schedule.
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          No classes have been scheduled yet.
        </p>
      </div>
    );
  }

  // 2. RENDER GRID: Filter events for each cell
  const getEventsForCell = (day: string, hour: number) => {
    return events.filter((e) => {
      const eventStartHour = parseInt(e.startTime.split(":")[0], 10);
      return e.day.toUpperCase() === day && eventStartHour === hour;
    });
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] gap-4">
          <div className="h-10"></div>
          {DAYS.map((day) => (
            <div key={day} className="text-center font-bold text-sm py-2 bg-primary/10 rounded">
              {day}
            </div>
          ))}
          {HOURS.map((hour) => (
            <React.Fragment key={hour}>
              <div className="text-right text-sm text-muted-foreground pt-2 pr-2">
                {`${hour.toString().padStart(2, "0")}:00`}
              </div>
              {DAYS.map((day) => {
                const cellEvents = getEventsForCell(day, hour);
                return (
                  <div key={`${day}-${hour}`} className="min-h-[100px] border rounded-lg p-1 bg-background relative">
                    {cellEvents.map((event) => (
                      <div key={event.id}>
                        <ClassEventCard
                          event={event}
                          onClick={() => onEventClick?.(event)}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};


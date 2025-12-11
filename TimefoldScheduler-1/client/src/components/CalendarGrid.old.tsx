import { useState } from "react";
import { ClassEventCard } from "./ClassEventCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format24To12Hour } from "@/lib/timeFormatter";
import { apiRequest } from "@/lib/queryClient";

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
  courseId: string;
  teacherId: string;
  studentGroupId: string;
}

interface CalendarGridProps {
  events: ClassEvent[];
  onEventClick: (event: ClassEvent) => void;
  onEventDragStart?: (event: ClassEvent) => void;
  onEventDrop?: (eventId: string, newDay: string, newStartTime: string) => void;
}

export function CalendarGrid({ events, onEventClick, onEventDragStart, onEventDrop }: CalendarGridProps) {
  // Empty state guard: show a friendly message when no data
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-muted-foreground">Please upload a file to view the schedule.</span>
      </div>
    );
  }
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const [draggedEvent, setDraggedEvent] = useState<ClassEvent | null>(null);
  // Track specifically which slot is being hovered to highlight ONLY that cell
  const [hoveredSlot, setHoveredSlot] = useState<{day: string, time: string} | null>(null);

  const getEventsForSlot = (day: string, time: string) => {
    return events.filter(event => 
      event.day === day && event.startTime === time
    );
  };

  const checkDragConflict = async (event: ClassEvent, day: string, startTime: string): Promise<boolean> => {
    try {
      const endTime = String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0') + ':00';
      const res = await fetch('/api/classes/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: event.teacherId,
          studentGroupId: event.studentGroupId,
          day,
          startTime,
          endTime,
          excludeClassId: event.id,
        }),
      });
      const data = await res.json();
      return data.hasConflict;
    } catch (error) {
      console.error('Error checking conflict:', error);
      return false;
    }
  };

  const handleDragStart = (event: ClassEvent) => {
    setDraggedEvent(event);
    onEventDragStart?.(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (day: string, time: string) => {
    if (draggedEvent) {
      setHoveredSlot({ day, time });
    }
  };

  const handleDrop = async (e: React.DragEvent, day: string, startTime: string) => {
    e.preventDefault();
    setHoveredSlot(null);
    
    if (!draggedEvent) return;

    const hasConflict = await checkDragConflict(draggedEvent, day, startTime);
    
    if (hasConflict) {
      setDraggedEvent(null);
      return;
    }

    onEventDrop?.(draggedEvent.id, day, startTime);
    setDraggedEvent(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="min-w-max">
            <div className="sticky top-0 z-20 bg-background border-b">
              <div className="flex">
                <div className="w-20 flex-shrink-0 border-r bg-card p-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Time
                  </span>
                </div>
                {days.map((day) => (
                  <div
                    key={day}
                    className="flex-1 min-w-[200px] border-r last:border-r-0 p-2 bg-card"
                  >
                    <div className="text-sm font-semibold" data-testid={`text-day-${day.toLowerCase()}`}>
                      {day}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y">
              {timeSlots.map((time) => (
                <div key={time} className="flex" data-testid={`row-time-${time}`}>
                  <div className="w-20 flex-shrink-0 border-r p-2 bg-muted/30">
                    <span className="text-xs text-muted-foreground">{format24To12Hour(time)}</span>
                  </div>
                  {days.map((day) => {
                    const slotEvents = getEventsForSlot(day, time);
                    const isHovered = hoveredSlot?.day === day && hoveredSlot?.time === time;
                    
                    return (
                      <div
                        key={`${day}-${time}`}
                        className={`flex-1 min-w-[200px] border-r last:border-r-0 p-2 min-h-[80px] transition-colors ${
                          isHovered ? 'bg-primary/10 border-2 border-primary border-dashed' : ''
                        }`}
                        data-testid={`cell-${day.toLowerCase()}-${time}`}
                        onDragOver={handleDragOver}
                        onDragEnter={() => handleDragEnter(day, time)}
                        onDrop={(e) => handleDrop(e, day, time)}
                      >
                        {slotEvents.length === 0 ? (
                          <div className={`h-full border border-dashed border-border/50 rounded-md ${isHovered ? 'opacity-0' : ''}`} />
                        ) : (
                          <div className="space-y-2">
                            {slotEvents.map((event) => (
                              <ClassEventCard
                                key={event.id}
                                event={event}
                                onClick={() => onEventClick(event)}
                                onDragStart={() => handleDragStart(event)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

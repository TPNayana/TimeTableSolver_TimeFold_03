import { useState } from "react";
import { ClassEventCard } from "./ClassEventCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format24To12Hour } from "@/lib/timeFormatter";

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

interface DailyViewProps {
  events: ClassEvent[];
  selectedDay: string;
  onEventClick: (event: ClassEvent) => void;
  onEventDragStart?: (event: ClassEvent) => void;
  onEventDrop?: (eventId: string, newDay: string, newStartTime: string) => void;
}

export function DailyView({ events, selectedDay, onEventClick, onEventDragStart, onEventDrop }: DailyViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<ClassEvent | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

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

  const handleDragEnter = (time: string) => {
    if (draggedEvent) {
      setHoveredSlot(time);
    }
  };

  const handleDrop = async (e: React.DragEvent, startTime: string) => {
    e.preventDefault();
    setHoveredSlot(null);
    
    if (!draggedEvent) return;

    const hasConflict = await checkDragConflict(draggedEvent, selectedDay, startTime);
    
    if (hasConflict) {
      setDraggedEvent(null);
      return;
    }

    onEventDrop?.(draggedEvent.id, selectedDay, startTime);
    setDraggedEvent(null);
  };
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const dayEvents = events.filter(e => e.day === selectedDay);

  const getEventsForSlot = (time: string) => {
    return dayEvents.filter(event => event.startTime === time);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="min-w-max">
            <div className="sticky top-0 z-20 bg-background border-b p-4">
              <div className="text-lg font-semibold">{selectedDay}</div>
            </div>

            <div className="divide-y">
              {timeSlots.map((time) => {
                const slotEvents = getEventsForSlot(time);
                return (
                  <div key={time} className="flex border-b" data-testid={`row-time-${time}`}>
                    <div className="w-24 flex-shrink-0 p-4 bg-muted/30 border-r">
                      <span className="text-xs text-muted-foreground font-medium">
                        {format24To12Hour(time)}
                      </span>
                    </div>
                    <div
                      className={`flex-1 p-4 min-h-[100px] hover-elevate transition-colors ${
                        hoveredSlot === time ? 'bg-primary/10 border-2 border-primary border-dashed' : ''
                      }`}
                      data-testid={`cell-${selectedDay.toLowerCase()}-${time}`}
                      onDragOver={handleDragOver}
                      onDragEnter={() => handleDragEnter(time)}
                      onDrop={(e) => handleDrop(e, time)}
                    >
                      {slotEvents.length === 0 ? (
                        <div className={`h-full border border-dashed border-border/50 rounded-md ${hoveredSlot === time ? 'opacity-0' : ''}`} />
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
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

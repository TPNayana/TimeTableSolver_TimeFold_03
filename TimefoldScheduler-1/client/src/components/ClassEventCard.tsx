import { GripVertical, User, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ClassEvent {
  id: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  studentGroup: string;
  meetingLink?: string;
  hasConflict?: boolean;
}

interface ClassEventCardProps {
  event: ClassEvent;
  onClick: () => void;
  onDragStart?: () => void;
}

export function ClassEventCard({ event, onClick, onDragStart }: ClassEventCardProps) {
  return (
    <Card
      className={`p-2 cursor-pointer hover:shadow-md transition-shadow relative group ${
        event.hasConflict ? 'border-l-4 border-l-destructive' : ''
      }`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      data-testid={`card-event-${event.id}`}
    >
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      
      <div className="space-y-1">
        <div className="font-medium text-sm" data-testid={`text-course-${event.id}`}>
          {event.courseName}
        </div>
        <div className="text-xs text-muted-foreground" data-testid={`text-code-${event.id}`}>
          {event.courseCode}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span data-testid={`text-teacher-${event.id}`}>{event.teacherName}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span data-testid={`text-group-${event.id}`}>{event.studentGroup}</span>
        </div>
        {event.meetingLink && (
          <div className="text-xs">
            <a href={event.meetingLink} target="_blank" rel="noreferrer" className="text-primary underline" data-testid={`link-meeting-${event.id}`}>Join</a>
          </div>
        )}
      </div>
      
      {event.hasConflict && (
        <div className="mt-1 text-xs text-destructive font-medium">
          Conflict detected
        </div>
      )}
    </Card>
  );
}

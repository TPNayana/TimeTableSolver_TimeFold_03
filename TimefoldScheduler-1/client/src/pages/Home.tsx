import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DailyView } from "@/components/DailyView";
import { UploadModal } from "@/components/UploadModal";
import { EditClassModal } from "@/components/EditClassModal";
import { ConflictBanner } from "@/components/ConflictBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function Home() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [showConflictBanner, setShowConflictBanner] = useState(true);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<ClassEvent[]>({
    queryKey: ['/api/classes/enriched'],
  });

  // Extract unique filter options dynamically from data
  const uniqueTeachers = Array.from(new Set(events.map(e => e.teacherName))).sort();
  const uniqueGroups = Array.from(new Set(events.map(e => e.studentGroup))).sort();
  const uniqueDepartments = Array.from(
    new Set(
      events.map(e => {
        const parts = e.studentGroup.split('-');
        return parts[0];
      })
    )
  ).sort();
  
  const filteredEvents = events.filter(event => {
    const deptMatch = selectedDepartments.length === 0 || selectedDepartments.some(d => event.studentGroup.startsWith(d));
    const teacherMatch = selectedTeachers.length === 0 || selectedTeachers.includes(event.teacherName);
    const groupMatch = selectedGroups.length === 0 || selectedGroups.includes(event.studentGroup);
    return deptMatch && teacherMatch && groupMatch;
  });

  const conflictCount = filteredEvents.filter(e => e.hasConflict).length;

  const handleClearFilters = () => {
    setSelectedDepartments([]);
    setSelectedTeachers([]);
    setSelectedGroups([]);
  };

  const handleEventClick = (event: ClassEvent) => {
    setSelectedEvent(event);
    setEditModalOpen(true);
  };

  const handleNewClass = () => {
    setSelectedEvent(null);
    setEditModalOpen(true);
  };

  const handleSaveEvent = async (event: ClassEvent) => {
    try {
      if (event.id) {
        await apiRequest('PATCH', `/api/classes/${event.id}`, {
          courseId: event.courseId,
          teacherId: event.teacherId,
          studentGroupId: event.studentGroupId,
          day: event.day,
          startTime: event.startTime,
          endTime: event.endTime,
        });
        toast({
          title: "Class updated",
          description: "The class has been updated successfully.",
        });
      } else {
        await apiRequest('POST', '/api/classes', {
          courseId: event.courseId,
          teacherId: event.teacherId,
          studentGroupId: event.studentGroupId,
          day: event.day,
          startTime: event.startTime,
          endTime: event.endTime,
        });
        toast({
          title: "Class created",
          description: "The class has been created successfully.",
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['/api/classes/enriched'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save class",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await apiRequest('DELETE', `/api/classes/${id}`, undefined);
      toast({
        title: "Class deleted",
        description: "The class has been deleted successfully.",
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/classes/enriched'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete class",
        variant: "destructive",
      });
    }
  };

  const handleEventDrop = async (eventId: string, newDay: string, newStartTime: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const newEndTime = String(parseInt(newStartTime.split(':')[0]) + 1).padStart(2, '0') + ':00';
    
    try {
      await apiRequest('PATCH', `/api/classes/${eventId}`, {
        courseId: event.courseId,
        teacherId: event.teacherId,
        studentGroupId: event.studentGroupId,
        day: newDay,
        startTime: newStartTime,
        endTime: newEndTime,
      });
      toast({
        title: "Class rescheduled",
        description: `Class moved to ${newDay} at ${newStartTime}`,
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/classes/enriched'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule class",
        variant: "destructive",
      });
    }
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <>
      {showConflictBanner && conflictCount > 0 && (
        <ConflictBanner
          conflictCount={conflictCount}
          onReview={() => console.log('Reviewing conflicts')}
          onDismiss={() => setShowConflictBanner(false)}
        />
      )}

      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar
            onUploadClick={() => setUploadModalOpen(true)}
            onNewClassClick={handleNewClass}
            selectedDepartments={selectedDepartments}
            onDepartmentChange={setSelectedDepartments}
            allDepartments={uniqueDepartments}
            selectedTeachers={selectedTeachers}
            onTeacherChange={setSelectedTeachers}
            allTeachers={uniqueTeachers}
            selectedGroups={selectedGroups}
            onGroupChange={setSelectedGroups}
            allGroups={uniqueGroups}
            onClearFilters={handleClearFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedDay={selectedDay}
            onSelectedDayChange={setSelectedDay}
          />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h2 className="text-lg font-semibold" data-testid="text-page-title">
                  {viewMode === "daily" ? `Daily Schedule - ${selectedDay}` : "Weekly Schedule"}
                </h2>
              </div>
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-hidden p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading schedule...</p>
                </div>
              ) : viewMode === "daily" ? (
                <DailyView
                  events={filteredEvents}
                  selectedDay={selectedDay}
                  onEventClick={handleEventClick}
                  onEventDragStart={(event) => console.log('Dragging:', event)}
                  onEventDrop={handleEventDrop}
                />
              ) : (
                <CalendarGrid
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onEventDragStart={(event) => console.log('Dragging:', event)}
                  onEventDrop={handleEventDrop}
                />
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      <EditClassModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={selectedEvent}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </>
  );
}

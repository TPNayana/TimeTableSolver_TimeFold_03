import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { Teacher, Course, StudentGroup } from "@shared/schema";

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
  courseId: string;
  teacherId: string;
  studentGroupId: string;
}

interface SmartSuggestion {
  day: string;
  startTime: string;
  endTime: string;
  available: boolean;
  conflicts: string[];
}

interface EditClassModalProps {
  open: boolean;
  onClose: () => void;
  event: ClassEvent | null;
  onSave: (event: ClassEvent) => void;
  onDelete?: (id: string) => void;
}

export function EditClassModal({ open, onClose, event, onSave, onDelete }: EditClassModalProps) {
  const [formData, setFormData] = useState<ClassEvent>(
    event || {
      id: "",
      courseName: "",
      courseCode: "",
      teacherName: "",
      studentGroup: "",
      day: "Monday",
      startTime: "09:00",
      endTime: "10:00",
      courseId: "",
      teacherId: "",
      studentGroupId: "",
    }
  );

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
    enabled: open,
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    enabled: open,
  });

  const { data: studentGroups = [], isLoading: loadingGroups } = useQuery<StudentGroup[]>({
    queryKey: ['/api/student-groups'],
    enabled: open,
  });

  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery<SmartSuggestion[]>({
    queryKey: ['/api/classes/smart-suggestions', formData.teacherId, formData.studentGroupId, event?.id],
    queryFn: async () => {
      const res = await fetch('/api/classes/smart-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: formData.teacherId,
          studentGroupId: formData.studentGroupId,
          excludeClassId: event?.id,
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      return res.json();
    },
    enabled: open && !!formData.teacherId && !!formData.studentGroupId,
  });

  useEffect(() => {
    if (event) {
      setFormData(event);
    } else {
      setFormData({
        id: "",
        courseName: "",
        courseCode: "",
        teacherName: "",
        studentGroup: "",
        meetingLink: "",
        day: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        courseId: "",
        teacherId: "",
        studentGroupId: "",
      });
    }
  }, [event, open]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-edit-class">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Class' : 'New Class'}</DialogTitle>
          <DialogDescription>
            {event ? 'Modify class details and schedule' : 'Add a new class to the timetable'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select
              value={formData.courseId}
              onValueChange={(value) => {
                const course = courses.find(c => c.id === value);
                setFormData({
                  ...formData,
                  courseId: value,
                  courseName: course?.name || "",
                  courseCode: course?.code || "",
                });
              }}
            >
              <SelectTrigger data-testid="select-course">
                <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.meetingLink && (
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <a href={formData.meetingLink} target="_blank" rel="noreferrer" className="text-primary underline" data-testid="details-meeting-link">Open meeting</a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher</Label>
              <Select
                value={formData.teacherId}
                onValueChange={(value) => {
                  const teacher = teachers.find(t => t.id === value);
                  setFormData({
                    ...formData,
                    teacherId: value,
                    teacherName: teacher?.name || "",
                  });
                }}
              >
                <SelectTrigger data-testid="select-teacher">
                  <SelectValue placeholder={loadingTeachers ? "Loading teachers..." : "Select teacher"} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentGroup">Student Group</Label>
              <Select
                value={formData.studentGroupId}
                onValueChange={(value) => {
                  const group = studentGroups.find(g => g.id === value);
                  setFormData({
                    ...formData,
                    studentGroupId: value,
                    studentGroup: group?.name || "",
                  });
                }}
              >
                <SelectTrigger data-testid="select-student-group">
                  <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select group"} />
                </SelectTrigger>
                <SelectContent>
                  {studentGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <Select
                value={formData.day}
                onValueChange={(value) => setFormData({ ...formData, day: value })}
              >
                <SelectTrigger data-testid="select-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Select
                value={formData.startTime}
                onValueChange={(value) => setFormData({ ...formData, startTime: value })}
              >
                <SelectTrigger data-testid="select-start-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {times.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Select
                value={formData.endTime}
                onValueChange={(value) => setFormData({ ...formData, endTime: value })}
              >
                <SelectTrigger data-testid="select-end-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {times.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.teacherId && formData.studentGroupId && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide">
                  Smart Suggestions
                </Label>
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading suggestions...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-md border ${
                          suggestion.available
                            ? 'border-border bg-card hover-elevate cursor-pointer'
                            : 'border-destructive/50 bg-destructive/5'
                        }`}
                        onClick={() => {
                          if (suggestion.available) {
                            setFormData({
                              ...formData,
                              day: suggestion.day,
                              startTime: suggestion.startTime,
                              endTime: suggestion.endTime,
                            });
                          }
                        }}
                        data-testid={`suggestion-${idx}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {suggestion.available ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-sm font-medium">
                              {suggestion.day}, {suggestion.startTime} - {suggestion.endTime}
                            </span>
                          </div>
                          {!suggestion.available && (
                            <span className="text-xs text-destructive">
                              {suggestion.conflicts.length} conflict(s)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No suggestions available</p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {event && onDelete && (
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              className="mr-auto"
              data-testid="button-delete-class"
            >
              Delete Class
            </Button>
          )}
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-edit">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-class">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

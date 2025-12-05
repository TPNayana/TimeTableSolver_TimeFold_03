import { EditClassModal } from '../EditClassModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function EditClassModalExample() {
  const [open, setOpen] = useState(false);
  
  const mockEvent = {
    id: "1",
    courseName: "Data Structures",
    courseCode: "CS201",
    teacherName: "Dr. Smith",
    studentGroup: "CS-3A",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    courseId: "course-1",
    teacherId: "teacher-1",
    studentGroupId: "group-1",
  };

  const mockSuggestions = [
    {
      day: "Tuesday",
      time: "10:00",
      available: true,
      conflicts: [],
    },
    {
      day: "Wednesday",
      time: "14:00",
      available: true,
      conflicts: [],
    },
    {
      day: "Thursday",
      time: "09:00",
      available: false,
      conflicts: ["Dr. Smith teaching CS301"],
    },
  ];

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Edit Modal</Button>
      <EditClassModal 
        open={open}
        onClose={() => setOpen(false)}
        event={mockEvent}
        onSave={(event) => console.log('Saved:', event)}
        onDelete={(id) => console.log('Deleted:', id)}
        suggestions={mockSuggestions}
      />
    </div>
  );
}

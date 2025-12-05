import { ClassEventCard } from '../ClassEventCard';

export default function ClassEventCardExample() {
  const mockEvent = {
    id: "1",
    courseName: "Data Structures",
    courseCode: "CS201",
    teacherName: "Dr. Smith",
    studentGroup: "CS-3A",
    hasConflict: false,
  };

  return (
    <div className="p-4">
      <ClassEventCard 
        event={mockEvent}
        onClick={() => console.log('Event clicked')}
        onDragStart={() => console.log('Drag started')}
      />
    </div>
  );
}

import { CalendarGrid } from '../CalendarGrid';

export default function CalendarGridExample() {
  const mockEvents = [
    {
      id: "1",
      courseName: "Data Structures",
      courseCode: "CS201",
      teacherName: "Dr. Smith",
      studentGroup: "CS-3A",
      day: "Monday",
      startTime: "09:00",
      endTime: "10:00",
      hasConflict: false,
    },
    {
      id: "2",
      courseName: "Calculus II",
      courseCode: "MATH202",
      teacherName: "Prof. Johnson",
      studentGroup: "MATH-2B",
      day: "Monday",
      startTime: "10:00",
      endTime: "11:00",
      hasConflict: false,
    },
    {
      id: "3",
      courseName: "Database Systems",
      courseCode: "CS301",
      teacherName: "Dr. Smith",
      studentGroup: "CS-4A",
      day: "Tuesday",
      startTime: "09:00",
      endTime: "10:00",
      hasConflict: true,
    },
    {
      id: "4",
      courseName: "Linear Algebra",
      courseCode: "MATH301",
      teacherName: "Dr. Williams",
      studentGroup: "CS-3A",
      day: "Wednesday",
      startTime: "11:00",
      endTime: "12:00",
      hasConflict: false,
    },
  ];

  return (
    <CalendarGrid 
      events={mockEvents}
      onEventClick={(event) => console.log('Event clicked:', event)}
      onEventDragStart={(event) => console.log('Drag started:', event)}
    />
  );
}

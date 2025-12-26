# Excel Template Instructions for Timetable Scheduling

## Overview
This Excel template has 4 sheets that work together to create optimized school timetables using AI scheduling.

## 1. Timeslots Sheet
**Purpose**: Defines all possible class time slots for the week.

### Columns:
- `DayOfWeek`: The weekday (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY)
- `StartTime`: Start time in 24-hour format (08:00:00, 09:00:00, etc.)
- `EndTime`: End time in 24-hour format (09:00:00, 10:00:00, etc.)

### Example:
DayOfWeek | StartTime | EndTime
MONDAY | 08:00:00 | 09:00:00
MONDAY | 09:00:00 | 10:00:00
...
FRIDAY | 16:00:00 | 17:00:00


### Guidelines:
- Include ALL possible time slots for classes (8 AM - 5 PM recommended)
- Each slot should be 1 hour (adjustable in code)
- Must have at least 5 days (Monday-Friday)

## 2. Room Sheet
**Purpose**: Lists all available classrooms/virtual meeting rooms.

### Columns:
- `Name`: Room name/identifier (e.g., "Room 101", "Science Lab", "Virtual Room A")
- `Link`: Meeting link for virtual rooms (optional for physical rooms)

### Example:
Name | Link
Science Lab | (leave blank for physical rooms)
Virtual A | https://meet.google.com/abc-xyz
Room 101 | (leave blank)


### Guidelines:
- Include ALL rooms available for scheduling
- For virtual rooms: Provide Google Meet/Teams/Zoom links
- For physical rooms: Leave Link column blank

## 3. Lesson Sheet
**Purpose**: Lists all classes that need to be scheduled.

### Columns:
- `Id`: Unique lesson identifier (e.g., "L1", "CS101-MON", etc.)
- `Subject`: Course name (e.g., "Data Structures", "Mathematics")
- `Teacher`: Teacher's name (must match TeacherAvailability sheet)
- `StudentGroup`: Student group/class (e.g., "CSE-A", "Grade 10B")

### Example:
Id | Subject | Teacher | StudentGroup
L1 | Math | Mr. Smith | Grade 10A
L2 | Physics | Dr. Jones | Grade 11B


### Important:
- **DO NOT** include MeetingLink column here
- Each lesson will be assigned a room automatically
- Meeting links come from the Room sheet

## 4. TeacherAvailability Sheet
**Purpose**: Defines when teachers are available to teach.

### Columns:
- `Teacher`: Teacher's name (must match Lesson sheet)
- `DayOfWeek`: Weekday (MONDAY, TUESDAY, etc.)
- `PreferredStart`: When teacher is available from (24-hour format)
- `PreferredEnd`: When teacher is available until (24-hour format)

### Example:
Teacher | DayOfWeek | PreferredStart | PreferredEnd
Mr. Smith | MONDAY | 08:00:00 | 12:00:00
Mr. Smith | WEDNESDAY | 10:00:00 | 16:00:00


### Guidelines:
- Teachers can have multiple availability entries
- Times should be within Timeslots range (8 AM - 5 PM)
- If teacher has no availability, their lessons won't be scheduled

## How to Prepare Your Data

### Step-by-Step Process:
1. **List all time slots** your school operates (8 AM - 5 PM, Monday-Friday)
2. **List all rooms** (classrooms, labs, virtual rooms with links)
3. **List all lessons** that need scheduling (course, teacher, student group)
4. **Collect teacher availability** (when each teacher can teach)

### Data Validation Tips:
- Ensure teacher names match exactly between Lesson and TeacherAvailability sheets
- All times in 24-hour format (HH:MM:SS)
- No duplicate room names
- Each lesson has a unique ID

## Upload Process
1. Fill all 4 sheets with your data
2. Save as Excel file (.xlsx)
3. Upload via the web interface
4. System will process and generate optimized timetable

## Example Scenario

**School**: ABC High School
**Operating Hours**: 8 AM - 5 PM, Monday-Friday
**Rooms**: 10 classrooms, 2 labs, 5 virtual rooms
**Teachers**: 15 teachers with various availabilities
**Classes**: 50 lessons to schedule across 5 student groups

The system will automatically assign all 50 lessons to time slots and rooms while respecting teacher availability.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Teacher has 0 available slots" | Add teacher availability in TeacherAvailability sheet |
| "No room assigned" | Ensure you have enough rooms in Room sheet |
| Lessons not scheduled | Check if teacher availability matches timeslots |
| Missing meeting links | Add links to Room sheet for virtual rooms |

## Support
For issues with the template, contact your system administrator.


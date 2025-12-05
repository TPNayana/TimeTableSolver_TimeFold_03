import * as XLSX from 'xlsx';

interface CSVRow {
  courseName?: string;
  courseCode?: string;
  teacherName?: string;
  studentGroup?: string;
  duration?: string;
  department?: string;
}

export interface ParsedTimetableData {
  teachers: Array<{ name: string; department?: string }>;
  studentGroups: Array<{ name: string; department?: string }>;
  courses: Array<{ name: string; code: string; department?: string; duration: number }>;
  schedules?: Array<{ courseCode: string; teacherName: string; studentGroup: string; startTime: string; endTime: string; day?: string }>;
  assignments?: Array<{ courseCode: string; teacherName: string; studentGroup: string }>; // For use with Timefold when no schedules provided
}

function parseTimeFormat(timeStr: string): string | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();
  
  // Try parsing "8.00 am", "8:00 am", "08:00", "8am", etc.
  const timeRegex = /^(\d{1,2})[:.′]?(\d{0,2})\s*(am|pm)?$/i;
  const match = cleaned.match(timeRegex);
  
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];
  
  if (meridiem) {
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  let newHours = h + hours;
  newHours = newHours % 24;
  return `${String(newHours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseCSV(csvContent: string): ParsedTimetableData {
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    console.log("=== RAW CSV HEADERS ===", lines[0]);
    console.log("=== EXTRACTED HEADER KEYS ===", header);
    console.log("=== RAW CSV CONTENT SAMPLE ===", lines.slice(0, 3));
    
    // Find column indices
    const courseNameIdx = findColumnIndex(header, ['course name', 'coursename', 'course']);
    const courseCodeIdx = findColumnIndex(header, ['course code', 'coursecode', 'code']);
    const teacherNameIdx = findColumnIndex(header, ['teacher name', 'teachername', 'teacher']);
    const studentGroupIdx = findColumnIndex(header, ['student group', 'studentgroup', 'group']);
    const durationIdx = findColumnIndex(header, ['duration', 'hours', 'start time', 'time']);
    const dayIdx = findColumnIndex(header, ['day', 'day of week', 'dayofweek']);
    const departmentIdx = findColumnIndex(header, ['department', 'dept']);

    console.log("=== COLUMN INDICES ===", {
      courseNameIdx,
      courseCodeIdx,
      teacherNameIdx,
      studentGroupIdx,
      durationIdx,
      dayIdx,
      departmentIdx,
    });

    if (courseNameIdx === -1 || courseCodeIdx === -1 || teacherNameIdx === -1 || studentGroupIdx === -1) {
      throw new Error('CSV must contain columns: Course Name, Course Code, Teacher Name, Student Group');
    }

    const teacherSet = new Set<string>();
    const studentGroupSet = new Set<string>();
    const courses: ParsedTimetableData['courses'] = [];
    const schedules: ParsedTimetableData['schedules'] = [];
    const assignments: ParsedTimetableData['assignments'] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      
      const courseName = values[courseNameIdx]?.trim();
      const courseCode = values[courseCodeIdx]?.trim();
      const teacherName = values[teacherNameIdx]?.trim();
      const studentGroup = values[studentGroupIdx]?.trim();
      const durationStr = durationIdx !== -1 ? values[durationIdx]?.trim() : '';
      const dayStr = dayIdx !== -1 ? values[dayIdx]?.trim() : undefined;
      const department = departmentIdx !== -1 ? values[departmentIdx]?.trim() : undefined;

      if (!courseName || !courseCode || !teacherName || !studentGroup) {
        console.warn(`Skipping row ${i + 1}: Missing required fields`);
        continue;
      }

      teacherSet.add(teacherName);
      studentGroupSet.add(studentGroup);

      // Avoid duplicate courses
      if (!courses.find(c => c.code === courseCode)) {
        courses.push({
          name: courseName,
          code: courseCode,
          department,
          duration: 1,
        });
      }

      // Always add to assignments (for Timefold solver)
      assignments.push({
        courseCode,
        teacherName,
        studentGroup,
      });

      // Try to parse time from duration column
      const parsedStartTime = parseTimeFormat(durationStr);
      if (parsedStartTime) {
        const endTime = addHours(parsedStartTime, 1);
        schedules.push({
          courseCode,
          teacherName,
          studentGroup,
          startTime: parsedStartTime,
          endTime,
          day: dayStr,
        });
      }
    }

    return {
      teachers: Array.from(teacherSet).map(name => ({ name })),
      studentGroups: Array.from(studentGroupSet).map(name => ({ name })),
      courses,
      schedules: schedules.length > 0 ? schedules : undefined,
      assignments: assignments.length > 0 ? assignments : undefined,
    };
  } catch (error) {
    console.error("=== CSV PARSE ERROR ===", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

function findColumnIndex(header: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const idx = header.indexOf(name);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

export function parseExcel(buffer: Buffer): ParsedTimetableData {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    if (!worksheet) {
      throw new Error('Excel file is empty or has no worksheets');
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (rows.length === 0) {
      throw new Error('Excel file has no data rows');
    }

    // Get header from first row keys
    const firstRow = rows[0] as Record<string, string>;
    const header = Object.keys(firstRow).map(h => h.trim().toLowerCase());

    console.log("=== RAW EXCEL HEADERS ===", Object.keys(firstRow));
    console.log("=== EXTRACTED HEADER KEYS ===", header);
    console.log("=== RAW EXCEL CONTENT SAMPLE ===", rows.slice(0, 3));

    // Find column indices
    const courseNameIdx = findColumnIndex(header, ['course name', 'coursename', 'course']);
    const courseCodeIdx = findColumnIndex(header, ['course code', 'coursecode', 'code']);
    const teacherNameIdx = findColumnIndex(header, ['teacher name', 'teachername', 'teacher']);
    const studentGroupIdx = findColumnIndex(header, ['student group', 'studentgroup', 'group']);
    const durationIdx = findColumnIndex(header, ['duration', 'hours', 'start time', 'time']);
    const dayIdx = findColumnIndex(header, ['day', 'day of week', 'dayofweek']);
    const departmentIdx = findColumnIndex(header, ['department', 'dept']);

    console.log("=== COLUMN INDICES ===", {
      courseNameIdx,
      courseCodeIdx,
      teacherNameIdx,
      studentGroupIdx,
      durationIdx,
      dayIdx,
      departmentIdx,
    });

    if (courseNameIdx === -1 || courseCodeIdx === -1 || teacherNameIdx === -1 || studentGroupIdx === -1) {
      throw new Error('Excel must contain columns: Course Name, Course Code, Teacher Name, Student Group');
    }

    const teacherSet = new Set<string>();
    const studentGroupSet = new Set<string>();
    const courses: ParsedTimetableData['courses'] = [];
    const schedules: ParsedTimetableData['schedules'] = [];
    const assignments: ParsedTimetableData['assignments'] = [];

    // Get actual header names for accessing object keys
    const headerNames = Object.keys(firstRow);
    const courseNameKey = headerNames[courseNameIdx];
    const courseCodeKey = headerNames[courseCodeIdx];
    const teacherNameKey = headerNames[teacherNameIdx];
    const studentGroupKey = headerNames[studentGroupIdx];
    const durationKey = durationIdx !== -1 ? headerNames[durationIdx] : undefined;
    const dayKey = dayIdx !== -1 ? headerNames[dayIdx] : undefined;
    const departmentKey = departmentIdx !== -1 ? headerNames[departmentIdx] : undefined;

    // Parse data rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Record<string, string>;
      
      const courseName = row[courseNameKey]?.toString().trim();
      const courseCode = row[courseCodeKey]?.toString().trim();
      const teacherName = row[teacherNameKey]?.toString().trim();
      const studentGroup = row[studentGroupKey]?.toString().trim();
      const durationStr = durationKey ? row[durationKey]?.toString().trim() : '';
      const dayStr = dayKey ? row[dayKey]?.toString().trim() : undefined;
      const department = departmentKey ? row[departmentKey]?.toString().trim() : undefined;

      if (!courseName || !courseCode || !teacherName || !studentGroup) {
        console.warn(`Skipping row ${i + 2}: Missing required fields`);
        continue;
      }

      teacherSet.add(teacherName);
      studentGroupSet.add(studentGroup);

      // Avoid duplicate courses
      if (!courses.find(c => c.code === courseCode)) {
        courses.push({
          name: courseName,
          code: courseCode,
          department,
          duration: 1,
        });
      }

      // Always add to assignments (for Timefold solver)
      assignments.push({
        courseCode,
        teacherName,
        studentGroup,
      });

      // Try to parse time from duration column
      const parsedStartTime = parseTimeFormat(durationStr);
      if (parsedStartTime) {
        const endTime = addHours(parsedStartTime, 1);
        schedules.push({
          courseCode,
          teacherName,
          studentGroup,
          startTime: parsedStartTime,
          endTime,
          day: dayStr,
        });
      }
    }

    return {
      teachers: Array.from(teacherSet).map(name => ({ name })),
      studentGroups: Array.from(studentGroupSet).map(name => ({ name })),
      courses,
      schedules: schedules.length > 0 ? schedules : undefined,
      assignments: assignments.length > 0 ? assignments : undefined,
    };
  } catch (error) {
    console.error("=== EXCEL PARSE ERROR ===", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

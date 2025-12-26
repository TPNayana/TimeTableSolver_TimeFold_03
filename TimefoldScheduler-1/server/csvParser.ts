import XLSX from "xlsx";
import crypto from "crypto";

type DayKey = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";

const DAY_MAP: Record<string, DayKey> = {
  MON: "MONDAY",
  MONDAY: "MONDAY",
  TUE: "TUESDAY",
  TUESDAY: "TUESDAY",
  WED: "WEDNESDAY",
  WEDNESDAY: "WEDNESDAY",
  THU: "THURSDAY",
  THURSDAY: "THURSDAY",
  FRI: "FRIDAY",
  FRIDAY: "FRIDAY",
};

function normalizeDay(value: unknown): DayKey {
  const v = String(value || "").trim().toUpperCase();
  const key = v.startsWith("MON")
    ? "MON"
    : v.startsWith("TUE")
    ? "TUE"
    : v.startsWith("WED")
    ? "WED"
    : v.startsWith("THU")
    ? "THU"
    : v.startsWith("FRI")
    ? "FRI"
    : v;
  const mapped = DAY_MAP[key];
  if (!mapped) throw new Error(`Invalid DayOfWeek '${value}'`);
  return mapped;
}

function normalizeTimeCell(v: unknown): string {
  if (v == null) return "";
  
  // Handle Excel time values (numbers between 0 and 1)
  if (typeof v === "number" && !Number.isNaN(v)) {
    const frac = v >= 1 ? v - Math.floor(v) : v;
    const totalMinutes = Math.round(frac * 24 * 60);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  
  const raw = String(v).trim();
  if (!raw) return "";
  
  // Handle HH:MM:SS format
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(":");
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  
  // Handle AM/PM format - ENHANCED VERSION
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3].toUpperCase();
    
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  
  // Also handle AM/PM without minutes (e.g., "9 AM")
  const ampmMatch2 = raw.match(/^(\d{1,2})\s*(AM|PM|am|pm)$/i);
  if (ampmMatch2) {
    let hours = parseInt(ampmMatch2[1], 10);
    const meridiem = ampmMatch2[2].toUpperCase();
    
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    
    return `${String(hours).padStart(2, "0")}:00`;
  }
  
  // Handle Excel time with AM/PM in different formats
  const dtMatch = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?/i);
  if (dtMatch) {
    let hours = parseInt(dtMatch[1], 10);
    const minutes = parseInt(dtMatch[2], 10);
    const meridiem = (dtMatch[3] || "").toUpperCase();
    
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  
  // Handle HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(raw)) return raw;
  
  if (/^\d{1,2}[.:]\d{2}$/.test(raw)) {
    const parts = raw.replace(".", ":").split(":");
    return `${String(parts[0]).padStart(2, "0")}:${String(parts[1]).padStart(2, "0")}`;
  }
  
  const m = raw.match(/^(\d{1,2})(?:[:.′]?(\d{0,2}))\s*(am|pm)?$/i);
  if (m) {
    let hours = parseInt(m[1] || "0", 10);
    const minutes = m[2] ? parseInt(m[2], 10) : 0;
    const meridiem = (m[3] || "").toUpperCase();
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  
  return raw;
}

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mapRowKeys(row: any, mapping: Record<string, string>) {
  const newRow: any = {};
  const rowKeys = Object.keys(row);

  for (const [targetKey, sourceKey] of Object.entries(mapping)) {
    const matchedKey = rowKeys.find((k) => normalizeKey(k) === normalizeKey(sourceKey));
    if (matchedKey) {
      newRow[targetKey] = row[matchedKey];
    }
  }
  return newRow;
}

function readSheetExact(wb: XLSX.WorkBook, expectedName: string) {
  const names = wb.SheetNames || [];
  const foundName = names.find((n) => String(n).trim().toLowerCase() === expectedName.toLowerCase());
  const sheet = foundName ? wb.Sheets[foundName] : undefined;
  if (!sheet) return null;
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows as Record<string, unknown>[];
}

function headerSet(rows: Record<string, unknown>[]) {
  const set = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((k) => set.add(String(k))));
  return Array.from(set.values());
}

function detectTypes(rows: Record<string, unknown>[]) {
  const types: Record<string, string> = {};
  rows.forEach((row) => {
    Object.entries(row).forEach(([k, v]) => {
      const t = v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
      types[k] = types[k] || t;
    });
  });
  return types;
}

export function parseExcel(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetNames = wb.SheetNames || [];
  console.log(`[excel] sheet names: ${JSON.stringify(sheetNames)}`);

  const allSheets = (wb.SheetNames || []).map((name) => ({
    name,
    rows: readSheetExact(wb, name) || [],
  }));

  const toLower = (arr: string[]) => arr.map((h) => String(h).trim().toLowerCase());
  const hasAll = (present: string[], requiredAliases: string[]) => {
    const p = new Set(toLower(present));
    return requiredAliases.every((r) => p.has(r));
  };
  const anyOf = (present: string[], aliases: string[]) => {
    const p = new Set(toLower(present));
    return aliases.some((a) => p.has(a));
  };

  const findTimeslots = () => {
    for (const s of allSheets) {
      const headers = headerSet(s.rows).map((h) => String(h).trim().toLowerCase());
      const ok = hasAll(headers, ["dayofweek"]) && anyOf(headers, ["starttime", "start", "from", "preferredstart"]) && anyOf(headers, ["endtime", "end", "to", "preferredend"]);
      if (ok) return s.rows;
    }
    return null;
  };
  const findRooms = () => {
    for (const s of allSheets) {
      const headers = headerSet(s.rows).map((h) => String(h).trim().toLowerCase());
      if (anyOf(headers, ["name", "roomname", "room"])) return s.rows;
    }
    return null;
  };
  const findLessons = () => {
    for (const s of allSheets) {
      const headers = headerSet(s.rows).map((h) => String(h).trim().toLowerCase());
      const ok = anyOf(headers, ["id", "lessonid"]) && anyOf(headers, ["subject", "course"]) && anyOf(headers, ["teacher", "teachername"]) && anyOf(headers, ["studentgroup", "student group", "group"]);
      if (ok) return s.rows;
    }
    return null;
  };
  const findAvailability = () => {
    for (const s of allSheets) {
      const headers = headerSet(s.rows).map((h) => String(h).trim().toLowerCase());
      const ok = anyOf(headers, ["teacher", "teachername"]) && anyOf(headers, ["dayofweek", "day"]) && anyOf(headers, ["starttime", "preferredstart", "start"]) && anyOf(headers, ["endtime", "preferredend", "end"]);
      if (ok) return s.rows;
    }
    return [];
  };

  const timeslotRows = findTimeslots();
  const roomRows = findRooms();
  const lessonRows = findLessons();
  const availabilityRows = findAvailability();
  if (!lessonRows) {
    throw new Error(
      `Excel format error: Missing Lessons sheet. Ensure columns Id, Subject, Teacher, StudentGroup exist.`
    );
  }
  if (!roomRows) {
    throw new Error(`Excel format error: Missing Rooms sheet. Ensure a Name column exists.`);
  }
  if (!timeslotRows) {
    throw new Error(`Excel format error: Missing Timeslots sheet. Ensure DayOfWeek, StartTime, EndTime columns exist.`);
  }
  const timeslotHeaders = headerSet(timeslotRows);
  const roomHeaders = headerSet(roomRows);
  const lessonHeaders = headerSet(lessonRows);
  const availabilityHeaders = headerSet(availabilityRows);
  console.log(`[excel] Timeslots headers: ${JSON.stringify(timeslotHeaders)}, types: ${JSON.stringify(detectTypes(timeslotRows))}`);
  console.log(`[excel] Room headers: ${JSON.stringify(roomHeaders)}, types: ${JSON.stringify(detectTypes(roomRows))}`);
  console.log(`[excel] Lesson headers: ${JSON.stringify(lessonHeaders)}, types: ${JSON.stringify(detectTypes(lessonRows))}`);
  console.log(`[excel] TeacherAvailability headers: ${JSON.stringify(availabilityHeaders)}, types: ${JSON.stringify(detectTypes(availabilityRows))}`);
  const requireHeader = (headers: string[], required: string[], sheetName: string) => {
    const lowered = headers.map((h) => String(h).trim().toLowerCase());
    const synonyms: Record<string, string[]> = {
      DayOfWeek: ["dayofweek", "day", "day_of_week"],
      StartTime: ["starttime", "start", "from", "preferredstart"],
      EndTime: ["endtime", "end", "to", "preferredend"],
      Name: ["name", "roomname", "name of room", "room"],
      Id: ["id", "lessonid"],
      Subject: ["subject", "course", "subject name"],
      Teacher: ["teacher", "teachername"],
      StudentGroup: ["studentgroup", "student group", "group"],
      MeetingLink: ["meetinglink", "link", "meeting link"],
    };
    for (const r of required) {
      const rkey = String(r).trim().toLowerCase();
      const candidates = [rkey, ...((synonyms as any)[r] || [])];
      const ok = candidates.some((c) => lowered.includes(c));
      if (!ok) {
        throw new Error(
          `Excel format error: The sheet or column ${sheetName}.${r} is missing. Accepted aliases: ${JSON.stringify((synonyms as any)[r] || [])}. Found headers: ${JSON.stringify(headers)}`
        );
      }
    }
  };
  requireHeader(timeslotHeaders, ["DayOfWeek", "StartTime", "EndTime"], "Timeslots");
  requireHeader(roomHeaders, ["Name"], "Rooms");
  requireHeader(lessonHeaders, ["Id", "Subject", "Teacher", "StudentGroup"], "Lesson");

  const timeslots = timeslotRows.map((row) => {
    const mapped = mapRowKeys(row, {
      dayOfWeek: 'DayOfWeek',
      startTime: 'StartTime',
      endTime: 'EndTime',
    });
    const day = normalizeDay(mapped.dayOfWeek ?? (row as any)["dayOfWeek"] ?? (row as any)["day"]);
    const startTime = normalizeTimeCell(mapped.startTime ?? (row as any)["start"] ?? "");
    const endTime = normalizeTimeCell(mapped.endTime ?? (row as any)["end"] ?? "");
    const id = `${day}_${startTime}`;
    return { id, dayOfWeek: day, startTime, endTime };
  });

  const rooms = roomRows.map((row) => {
    const mapped = mapRowKeys(row, { name: 'Name', link: 'Link' });
    const name = cleanText(mapped.name ?? (row as any)["name"] ?? "");
    if (!name) {
      console.warn(`[Parser] Skipping room row without name: ${JSON.stringify(row)}`);
      return null;
    }
    const linkRaw = mapped.link ?? (row as any)["link"];
    const link = linkRaw != null ? cleanText(linkRaw) || null : null;
    return { id: name, name, link };
  }).filter(Boolean) as { id: string; name: string; link: string | null }[];

  const lessons = lessonRows
    .map((row) => {
      const mapped = mapRowKeys(row, {
        id: 'Id',
        subject: 'Subject',
        teacher: 'Teacher',
        studentGroup: 'StudentGroup',
        meetingLink: 'MeetingLink',
      });
      const id = cleanText(mapped.id ?? (row as any)["id"] ?? "");
      const subject = cleanText(mapped.subject ?? (row as any)["subject"] ?? "");
      const teacher = cleanText(mapped.teacher ?? (row as any)["teacher"] ?? "");
      const studentGroup = cleanText(mapped.studentGroup ?? (row as any)["studentGroup"] ?? "");
      const meetingLink = cleanText(mapped.meetingLink ?? (row as any)["meetingLink"] ?? "") || null;
      if (!id || !subject || !teacher || !studentGroup) {
        console.warn(`[Parser] Skipping invalid lesson row: ${JSON.stringify(row)}`);
        return null;
      }
      return { id, subject, teacher, studentGroup, meetingLink, timeslot: null, room: null };
    })
    .filter(Boolean) as {
      id: string;
      subject: string;
      teacher: string;
      studentGroup: string;
      meetingLink: string | null;
      timeslot: null;
      room: null;
    }[];

  const teacherSet = new Set<string>();
  const groupSet = new Set<string>();
  const courseSet = new Set<string>();
  for (const l of lessons) {
    if (l.teacher) teacherSet.add(l.teacher);
    if (l.studentGroup) groupSet.add(l.studentGroup);
    if (l.subject) courseSet.add(l.subject);
  }

  const teachers = Array.from(teacherSet).map((name) => ({ name }));
  const studentGroups = Array.from(groupSet).map((name) => ({ name }));
  const courses = Array.from(courseSet).map((name) => ({ name }));
  const teacherAvailabilities = (availabilityRows || [])
    .map((row, i) => {
      const mapped = mapRowKeys(row, {
        teacher: 'Teacher',
        dayOfWeek: 'DayOfWeek',
        startTime: 'PreferredStart',
        endTime: 'PreferredEnd',
      });
      const teacher = cleanText(mapped.teacher ?? (row as any)["TeacherName"] ?? (row as any)["teacher"] ?? "");
      const dayOfWeek = normalizeDay(mapped.dayOfWeek ?? (row as any)["Day"] ?? (row as any)["dayOfWeek"] ?? "");
      const startTime = normalizeTimeCell(mapped.startTime ?? (row as any)["StartTime"] ?? (row as any)["Start"] ?? "");
      const endTime = normalizeTimeCell(mapped.endTime ?? (row as any)["EndTime"] ?? (row as any)["End"] ?? "");
      if (!teacher || !dayOfWeek || !startTime || !endTime) {
        console.warn(`[Parser] Skipping invalid availability row: ${JSON.stringify(row)}`);
        return null;
      }
      const id = String(i + 1);
      return { id, teacher, dayOfWeek, startTime, endTime };
    })
    .filter(Boolean) as { id: string; teacher: string; dayOfWeek: DayKey; startTime: string; endTime: string }[];
  console.log(`[excel] parsed counts: timeslots=${timeslots.length}, rooms=${rooms.length}, lessons=${lessons.length}, availabilities=${teacherAvailabilities.length}`);
  console.log(`[Parser] Found ${lessonRows.length} raw lesson rows.`);
  console.log(`[Parser] First parsed lesson:`, lessons[0]);
  console.log(`[Parser] Parsed ${lessons.length} valid lessons, ${timeslots.length} timeslots, ${rooms.length} rooms.`);
  const lessonTeachers = new Set(lessons.map(l => cleanText(l.teacher).toUpperCase()));
  const availabilityTeachers = new Set(teacherAvailabilities.map(a => cleanText(a.teacher).toUpperCase()));
  const missingTeachers = Array.from(lessonTeachers).filter(t => !availabilityTeachers.has(t));
  if (missingTeachers.length > 0) {
    console.warn(`[Parser] TeacherAvailability mismatch: ${missingTeachers.length} teacher(s) missing -> ${missingTeachers.join(', ')}`);
  } else {
    console.log(`[Parser] TeacherAvailability mismatch: none`);
  }
  return { timeslots, rooms, lessons, teachers, studentGroups, courses, teacherAvailabilities };
}
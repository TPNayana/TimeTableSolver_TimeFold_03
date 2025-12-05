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
  if (typeof v === "number" && !Number.isNaN(v)) {
    const totalMinutes = Math.round(v * 24 * 60);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  const str = String(v).trim();
  if (!str) return "";
  if (/^\d{1,2}:\d{2}$/.test(str)) return str;
  if (/^\d{1,2}[.:]\d{2}$/.test(str)) {
    const parts = str.replace(".", ":").split(":");
    return `${String(parts[0]).padStart(2, "0")}:${String(parts[1]).padStart(2, "0")}`;
  }
  return str;
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
  // Be flexible with sheet naming: support singular/plural and common variants
  const readSheetFromAliases = (aliases: string[]) => {
    const lowered = aliases.map((a) => a.trim().toLowerCase());
    const found = (wb.SheetNames || []).find(
      (n) => lowered.includes(String(n).trim().toLowerCase())
    );
    return found ? readSheetExact(wb, found) : null;
  };

  const timeslotRows =
    readSheetFromAliases(["Timeslots", "TimeSlots", "Timeslot"]) || null;
  const roomRows = readSheetFromAliases(["Room", "Rooms"]) || null;
  const lessonRows = readSheetFromAliases(["Lesson", "Lessons"]) || null;
  const availabilityRows =
    readSheetFromAliases(["TeacherAvailability", "Availability", "Teacher Availabilities"]) || [];

  if (!timeslotRows || !roomRows || !lessonRows) {
    throw new Error(
      `Invalid template. Required sheets: Timeslots (or TimeSlots), Room (or Rooms), Lesson (or Lessons). Optional: TeacherAvailability. Found sheets: ${JSON.stringify(sheetNames)}`
    );
  }
  const timeslotHeaders = headerSet(timeslotRows);
  const roomHeaders = headerSet(roomRows);
  const lessonHeaders = headerSet(lessonRows);
  const availabilityHeaders = headerSet(availabilityRows);
  console.log(`[excel] Timeslots headers: ${JSON.stringify(timeslotHeaders)}, types: ${JSON.stringify(detectTypes(timeslotRows))}`);
  console.log(`[excel] Room headers: ${JSON.stringify(roomHeaders)}, types: ${JSON.stringify(detectTypes(roomRows))}`);
  console.log(`[excel] Lesson headers: ${JSON.stringify(lessonHeaders)}, types: ${JSON.stringify(detectTypes(lessonRows))}`);
  console.log(`[excel] TeacherAvailability headers: ${JSON.stringify(availabilityHeaders)}, types: ${JSON.stringify(detectTypes(availabilityRows))}`);
  // Validate required headers
  const requireHeader = (headers: string[], required: string[], sheetName: string) => {
    for (const r of required) {
      if (!headers.map((h) => h.toLowerCase()).includes(r.toLowerCase())) {
        throw new Error(
          `Excel format error: The sheet or column ${sheetName}.${r} is missing. Use the excel which i send now as template. Found headers: ${JSON.stringify(headers)}`
        );
      }
    }
  };
  requireHeader(timeslotHeaders, ["DayOfWeek", "StartTime", "EndTime"], "Timeslots");
  requireHeader(roomHeaders, ["Name"], "Room");
  requireHeader(lessonHeaders, ["Id", "Subject", "Teacher", "StudentGroup"], "Lesson");

  const timeslots = timeslotRows.map((row) => {
    const day = normalizeDay(row["DayOfWeek"] ?? row["dayOfWeek"] ?? row["day"]);
    const startTime = normalizeTimeCell(row["StartTime"] ?? row["start"] ?? "");
    const endTime = normalizeTimeCell(row["EndTime"] ?? row["end"] ?? "");
    const id = `${day}_${startTime}`;
    return { id, dayOfWeek: day, startTime, endTime };
  });

  const rooms = roomRows.map((row) => ({ id: crypto.randomUUID(), name: String(row["Name"] ?? row["name"] ?? "").trim(), link: String((row as any)["Link"] ?? (row as any)["link"] ?? "").trim() || null }));

  const lessons = lessonRows.map((row) => ({
    id: String(row["Id"] ?? row["id"]).trim(),
    subject: String(row["Subject"] ?? row["subject"]).trim(),
    teacher: String(row["Teacher"] ?? row["teacher"]).trim(),
    studentGroup: String(row["StudentGroup"] ?? row["studentGroup"]).trim(),
    meetingLink: String(row["MeetingLink"] ?? row["meetingLink"] ?? "").trim() || null,
    timeslot: null,
    room: null,
  }));

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
  const teacherAvailabilities = (availabilityRows || []).map((row) => {
    const teacher = String(row["Teacher"] ?? (row as any)["TeacherName"] ?? "").trim();
    const dayOfWeek = normalizeDay(row["DayOfWeek"] ?? (row as any)["Day"] ?? "");
    const startTime = normalizeTimeCell((row as any)["PreferredStart"] ?? row["StartTime"] ?? (row as any)["Start"] ?? "");
    const endTime = normalizeTimeCell((row as any)["PreferredEnd"] ?? row["EndTime"] ?? (row as any)["End"] ?? "");
    const id = crypto.randomUUID();
    return { id, teacher, dayOfWeek, startTime, endTime };
  });
  // Ensure timeslot coverage for availability windows: add missing 1-hour slots at availability start times
  const tsSet = new Set(timeslots.map(ts => ts.id));
  const addHour = (t: string) => {
    const [h, m] = String(t).split(":").map(Number);
    const hh = (h + 1);
    return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  for (const a of teacherAvailabilities) {
    if (!a.startTime) continue;
    const id = `${a.dayOfWeek}_${a.startTime}`;
    if (!tsSet.has(id)) {
      const endTime = a.endTime || addHour(a.startTime);
      timeslots.push({ id, dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime });
      tsSet.add(id);
    }
  }
  console.log(`[excel] parsed counts: timeslots=${timeslots.length}, rooms=${rooms.length}, lessons=${lessons.length}, availabilities=${teacherAvailabilities.length}`);
  return { timeslots, rooms, lessons, teachers, studentGroups, courses, teacherAvailabilities };
}

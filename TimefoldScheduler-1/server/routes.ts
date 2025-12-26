import express from "express";
import multer from "multer";
import { parseExcel } from "./csvParser";
import { storage } from "./storage";
import { startSolve, getStatus, getSolution } from "./timefoldClient";
import { detectConflicts } from "./conflictDetection";

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to generate 8 AM - 5 PM timeslots
function generateDefaultTimeslots() {
  const timeslots: Array<{id: string, dayOfWeek: string, startTime: string, endTime: string}> = [];
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const startHour = 8;
  const endHour = 17;
  
  for (const day of days) {
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const id = `${day}_${startTime}`;
      
      timeslots.push({
        id,
        dayOfWeek: day,
        startTime,
        endTime
      });
    }
  }
  
  return timeslots;
}

// Filter teacher availabilities to only include times within 8 AM - 5 PM
function filterTeacherAvailabilities(availabilities: any[]) {
  return availabilities.map(av => {
    // Parse times
    const [startHour, startMin] = av.startTime.split(':').map(Number);
    const [endHour, endMin] = av.endTime.split(':').map(Number);
    
    // Adjust if outside 8-5 range
    let adjustedStartTime = av.startTime;
    let adjustedEndTime = av.endTime;
    
    if (startHour < 8) {
      adjustedStartTime = "08:00";
    }
    if (endHour > 17 || (endHour === 17 && endMin > 0)) {
      adjustedEndTime = "17:00";
    }
    
    return {
      ...av,
      startTime: adjustedStartTime,
      endTime: adjustedEndTime
    };
  });
}

async function clearAll() {
  const classes = await storage.getAllClasses();
  for (const it of classes) await storage.deleteClass(it.id);
  const teachers = await storage.getAllTeachers();
  for (const it of teachers) await storage.deleteTeacher(it.id);
  const groups = await storage.getAllStudentGroups();
  for (const it of groups) await storage.deleteStudentGroup(it.id);
  const courses = await storage.getAllCourses();
  for (const it of courses) await storage.deleteCourse(it.id);
  const avs = await storage.getAllTeacherAvailabilities();
  for (const it of avs) await storage.deleteTeacherAvailability(it.id);
}

function isInsideWindow(start: string, end: string, windowStart: string, windowEnd: string) {
  return start >= windowStart && end <= windowEnd;
}

function sortTimeslotsByDayAndTime(slots: Array<{ dayOfWeek: string; startTime: string; endTime: string }>) {
  const order = new Map([["MONDAY", 1], ["TUESDAY", 2], ["WEDNESDAY", 3], ["THURSDAY", 4], ["FRIDAY", 5]]);
  return [...slots].sort((a, b) => {
    const da = order.get(String(a.dayOfWeek)) || 99;
    const db = order.get(String(b.dayOfWeek)) || 99;
    if (da !== db) return da - db;
    return String(a.startTime).localeCompare(String(b.startTime));
  });
}

function buildValidation(parsed: any) {
  const warnings: string[] = [];
  const conflicts: Array<{ lessonId: string; teacher: string; reason: string; suggestions: Array<{ dayOfWeek: string; startTime: string; endTime: string }> }> = [];
  const byTeacher = new Map<string, Array<{ dayOfWeek: string; startTime: string; endTime: string }>>();
  for (const a of parsed.teacherAvailabilities || []) {
    const arr = byTeacher.get(a.teacher) || [];
    arr.push({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime });
    byTeacher.set(a.teacher, arr);
  }
  const allowedByTeacher = new Map<string, Array<{ dayOfWeek: string; startTime: string; endTime: string }>>();
  for (const [teacher, windows] of byTeacher.entries()) {
    const allowed = parsed.timeslots.filter((ts: any) => windows.some((w: any) => isInsideWindow(ts.startTime, ts.endTime, w.startTime, w.endTime) && String(ts.dayOfWeek) === String(w.dayOfWeek)));
    allowedByTeacher.set(teacher, sortTimeslotsByDayAndTime(allowed));
  }
  const lessonsByTeacher = new Map<string, number>();
  for (const l of parsed.lessons) lessonsByTeacher.set(l.teacher, (lessonsByTeacher.get(l.teacher) || 0) + 1);
  for (const [teacher, count] of lessonsByTeacher.entries()) {
    const allowed = allowedByTeacher.get(teacher) || [];
    if ((byTeacher.get(teacher) || []).length === 0) warnings.push(`Teacher ${teacher} has 0 available slots defined`);
    if (allowed.length < count) warnings.push(`Required hours (${count}) exceed available timeslots (${allowed.length}) for ${teacher}`);
  }
  for (const l of parsed.lessons) {
    const allowed = allowedByTeacher.get(l.teacher) || [];
    if (allowed.length === 0) {
      const windows = byTeacher.get(l.teacher) || [];
      conflicts.push({ lessonId: l.id, teacher: l.teacher, reason: `No available timeslots for ${l.teacher}`, suggestions: windows.map(w => ({ dayOfWeek: w.dayOfWeek, startTime: w.startTime, endTime: w.endTime })).slice(0, 3) });
    }
  }
  return { warnings, conflicts, suggestions: Object.fromEntries([...allowedByTeacher.entries()].map(([k, v]) => [k, v.slice(0, 5)])) };
}

function parseTimeslotId(id: string, endMap: Map<string, string>) {
  const parts = String(id).split("_");
  const dayKey = parts[0];
  const start = parts[1] || "09:00";
  const day = ({ MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday", FRIDAY: "Friday" } as Record<string, string>)[dayKey] || dayKey;
  const mappedEnd = endMap.get(String(id));
  const end = mappedEnd || `${String(Number(start.split(":")[0]) + 1).padStart(2, "0")}:${start.split(":")[1] || "00"}`;
  return { day, startTime: start, endTime: end };
}

async function persistSolution(solution: any, originalLessonsById: Map<string, any>, originalRooms: any[]) {
  const timeslots = Array.isArray(solution?.timeslots) ? solution.timeslots : [];
  const endMap = new Map(timeslots.map((ts: any) => [String(ts.id), String(ts.endTime || "")]));
  const lessons = Array.isArray(solution?.lessons) ? solution.lessons : [];
  
  const teachers = await storage.getAllTeachers();
  const groups = await storage.getAllStudentGroups();
  const courses = await storage.getAllCourses();
  const avs = await storage.getAllTeacherAvailabilities();
  
  const teacherByName = new Map(teachers.map((t) => [t.name, t]));
  const groupByName = new Map(groups.map((g) => [g.name, g]));
  const courseByName = new Map(courses.map((c) => [c.name, c]));
  const dayKeyToUi = new Map([
    ["MONDAY", "Monday"],
    ["TUESDAY", "Tuesday"],
    ["WEDNESDAY", "Wednesday"],
    ["THURSDAY", "Thursday"],
    ["FRIDAY", "Friday"],
  ]);
  
  // Create map of room name to room link
  const roomLinkMap = new Map<string, string | null>();
  for (const room of originalRooms) {
    roomLinkMap.set(String(room.id), room.link || null);
  }
  
  const avByTeacherDay = new Map<string, Array<{ startTime: string; endTime: string }>>();
  for (const a of avs) {
    const key = `${a.teacher}|${a.day}`;
    const arr = avByTeacherDay.get(key) || [];
    arr.push({ startTime: a.startTime, endTime: a.endTime });
    avByTeacherDay.set(key, arr);
  }
  
  const addMinutes = (t: string, minutes: number) => {
    const [h, m] = String(t).split(":").map(Number);
    const total = h * 60 + m + minutes;
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  
  const teacherLessons: Map<string, any[]> = new Map();
  const groupLessons: Map<string, any[]> = new Map();
  const roomUsageBySlot: Map<string, Set<string>> = new Map();
  const createdSummary: Array<{ teacher: string; day: string; startTime: string; endTime: string; course: string; group: string; meetingLink?: string | null }> = [];
  const skipped: Array<{ id: string; teacher: string; reason: string }> = [];
  
  for (const l of lessons) {
    if (!l.timeslot) continue;
    
    const ts = parseTimeslotId(String(l.timeslot), endMap);
    const course = courseByName.get(String(l.subject));
    const teacher = teacherByName.get(String(l.teacher));
    const group = groupByName.get(String(l.studentGroup));
    
    if (!course || !teacher || !group) { 
      skipped.push({ id: String(l.id), teacher: String(l.teacher), reason: 'missing entity' }); 
      continue; 
    }
    
    // Get the original lesson for any additional data (though meetingLink should come from room)
    const orig = originalLessonsById.get(String(l.id));
    
    // Check teacher availability
    const avKey = `${teacher.name}|${ts.day}`;
    const windows = avByTeacherDay.get(avKey) || [];
    if (windows.length > 0) {
      const inside = windows.some(w => ts.startTime >= w.startTime && ts.endTime <= w.endTime);
      if (!inside) { 
        skipped.push({ 
          id: String(l.id), 
          teacher: teacher.name, 
          reason: `outside availability (${ts.day} ${ts.startTime}-${ts.endTime})` 
        }); 
        continue; 
      }
    }
    
    // Check teacher double-booking
    const existingLessons = teacherLessons.get(teacher.id) || [];
    const overlapsTeacher = existingLessons.some(el => !(ts.endTime <= el.startTime || ts.startTime >= el.endTime));
    if (overlapsTeacher) { 
      skipped.push({ id: String(l.id), teacher: teacher.name, reason: 'teacher double-booked' }); 
      continue; 
    }
    
    // Check group overlap
    const existingGroupLessons = groupLessons.get(group.id) || [];
    const overlapsGroup = existingGroupLessons.some(el => !(ts.endTime <= el.startTime || ts.startTime >= el.endTime));
    if (overlapsGroup) { 
      skipped.push({ id: String(l.id), teacher: teacher.name, reason: `group overlap (${group.name})` }); 
      continue; 
    }
    
    // Enforce room occupancy if solver provided room
    const slotKey = `${ts.day}|${ts.startTime}|${ts.endTime}`;
    if (l.room) {
      const usedRooms = roomUsageBySlot.get(slotKey) || new Set<string>();
      if (usedRooms.has(String(l.room))) { 
        skipped.push({ id: String(l.id), teacher: teacher.name, reason: `room overlap (${String(l.room)})` }); 
        continue; 
      }
      usedRooms.add(String(l.room));
      roomUsageBySlot.set(slotKey, usedRooms);
    } else {
      // If no room assigned, skip persistence to avoid invalid schedule
      skipped.push({ id: String(l.id), teacher: teacher.name, reason: 'no room assigned' });
      continue;
    }
    
    // Get meeting link from the assigned room (not from lesson)
    const meetingLink = l.room ? roomLinkMap.get(String(l.room)) || null : null;
    
    await storage.createClass({ 
      courseId: course.id, 
      teacherId: teacher.id, 
      studentGroupId: group.id, 
      day: ts.day, 
      startTime: ts.startTime, 
      endTime: ts.endTime, 
      hasConflict: false, 
      meetingLink: meetingLink  // Use room's link, not lesson's
    });
    
    existingLessons.push({ startTime: ts.startTime, endTime: ts.endTime });
    teacherLessons.set(teacher.id, existingLessons);
    
    existingGroupLessons.push({ startTime: ts.startTime, endTime: ts.endTime });
    groupLessons.set(group.id, existingGroupLessons);
    
    createdSummary.push({ 
      teacher: teacher.name, 
      day: ts.day, 
      startTime: ts.startTime, 
      endTime: ts.endTime, 
      course: course.name, 
      group: group.name,
      meetingLink: meetingLink
    });
  }
  
  // DEBUG: Print concise persisted schedule summary grouped by teacher
  if (createdSummary.length > 0) {
    const byTeacher = new Map<string, Array<string>>();
    for (const it of createdSummary) {
      const arr = byTeacher.get(it.teacher) || [];
      const meetingLinkText = it.meetingLink ? ` [${it.meetingLink}]` : '';
      arr.push(`${it.day} ${it.startTime}-${it.endTime} ${it.course} (${it.group})${meetingLinkText}`);
      byTeacher.set(it.teacher, arr);
    }
    console.log("[persist] Created classes summary:");
    for (const [t, lines] of byTeacher.entries()) {
      console.log(`  - ${t}: ${lines.join("; ")}`);
    }
  } else {
    console.log("[persist] No classes persisted (filtered by strict availability/conflict checks)");
  }
  
  if (skipped.length > 0) {
    console.log(`[persist] Skipped ${skipped.length} lessons:`, skipped);
  }
  
  return { created: createdSummary.length, skipped: skipped.length };
}

async function startAndPollSolve(timetable: any, originalLessons: any[]) {
  // ENHANCEMENT: Ensure we have proper 8 AM - 5 PM timeslots
  let timeslots = timetable.timeslots;
  let teacherAvailabilities = timetable.teacherAvailabilities;
  
  // If timeslots don't cover 8 AM - 5 PM, generate them
  const hasFullDayCoverage = timeslots.some((ts: any) => {
    const hour = parseInt(ts.startTime.split(':')[0]);
    return hour === 8; // Check if we have 8 AM timeslots
  });
  
  if (!hasFullDayCoverage || timeslots.length < 9) { // 9 slots = 8-5
    console.log("[solver] Generating default 8 AM - 5 PM timeslots");
    timeslots = generateDefaultTimeslots();
    
    // Also filter teacher availabilities to 8-5 range
    teacherAvailabilities = filterTeacherAvailabilities(teacherAvailabilities);
  }
  
  // Create enhanced timetable with proper timeslots
  const enhancedTimetable = {
    ...timetable,
    timeslots,
    teacherAvailabilities
  };
  
  const { jobId } = await startSolve(enhancedTimetable);
  const intervalId = setInterval(async () => {
    try {
      const status = await getStatus(jobId);
      if (String(status?.solverStatus) === "NOT_SOLVING") {
        clearInterval(intervalId);
        const solution = await getSolution(jobId);
        const classes = await storage.getAllClasses();
        for (const c of classes) await storage.deleteClass(c.id);
        await persistSolution(
          solution, 
          new Map(originalLessons.map(l => [String(l.id), l])),
          timetable.rooms  // Pass rooms to persistSolution for meeting links
        );
      }
    } catch {
      clearInterval(intervalId);
    }
  }, 1000);
  return { jobId };
}

export async function registerRoutes(app: express.Express) {
  // Clear all in-memory data to ensure strict "latest Excel only"
  app.post("/api/clear", async (_req, res) => {
    await clearAll();
    res.json({ status: "ok" });
  });

  app.get("/api/classes", async (_req, res) => {
    const classes = await storage.getAllClasses();
    res.json(classes);
  });
  app.get("/api/teachers", async (_req, res) => {
    const teachers = await storage.getAllTeachers();
    res.json(teachers);
  });
  app.get("/api/student-groups", async (_req, res) => {
    const groups = await storage.getAllStudentGroups();
    res.json(groups);
  });
  app.get("/api/courses", async (_req, res) => {
    const courses = await storage.getAllCourses();
    res.json(courses);
  });
  // Place enriched route BEFORE the id route to avoid path collision
  app.get("/api/classes/enriched", async (_req, res) => {
    const classes = await storage.getAllClasses();
    const teachers = await storage.getAllTeachers();
    const courses = await storage.getAllCourses();
    const groups = await storage.getAllStudentGroups();
    const tById = new Map(teachers.map((t) => [t.id, t]));
    const cById = new Map(courses.map((c) => [c.id, c]));
    const gById = new Map(groups.map((g) => [g.id, g]));
    const enriched = classes.map((cl) => ({
      id: cl.id,
      courseName: cById.get(cl.courseId)?.name || "",
      courseCode: cById.get(cl.courseId)?.code || "",
      teacherName: tById.get(cl.teacherId)?.name || "",
      studentGroup: gById.get(cl.studentGroupId)?.name || "",
      day: cl.day,
      startTime: cl.startTime,
      endTime: cl.endTime,
      hasConflict: !!cl.hasConflict,
      meetingLink: cl.meetingLink || "",
      courseId: cl.courseId,
      teacherId: cl.teacherId,
      studentGroupId: cl.studentGroupId,
    }));
    res.json(enriched);
  });
  app.get("/api/classes/:id", async (req, res) => {
    const cls = await storage.getClass(req.params.id);
    if (!cls) return res.status(404).json({ error: "Class not found" });
    res.json(cls);
  });

  app.post("/api/classes/check-conflicts", async (req, res) => {
    const { teacherId, studentGroupId, day, startTime, endTime, excludeClassId } = req.body || {};
    if (!teacherId || !studentGroupId || !day || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existingClasses = await storage.getAllClasses();
    const conflictInfo = detectConflicts({ teacherId, studentGroupId, day, startTime, endTime, id: excludeClassId }, existingClasses);
    res.json(conflictInfo);
  });

  app.patch("/api/classes/:id", async (req, res) => {
    const existing = await storage.getClass(req.params.id);
    if (!existing) return res.status(404).json({ error: "Class not found" });

    const updated = {
      ...existing,
      day: req.body?.day ?? existing.day,
      startTime: req.body?.startTime ?? existing.startTime,
      endTime: req.body?.endTime ?? existing.endTime,
      courseId: req.body?.courseId ?? existing.courseId,
      teacherId: req.body?.teacherId ?? existing.teacherId,
      studentGroupId: req.body?.studentGroupId ?? existing.studentGroupId,
    };

    const existingClasses = await storage.getAllClasses();
    const conflictInfo = detectConflicts(updated as any, existingClasses);

    // Buffer logic removed: strict conflicts only
    const saved = await storage.updateClass(req.params.id, { ...updated, hasConflict: conflictInfo.hasConflict });
    res.json({ ...saved, conflictInfo });
  });

  app.post("/api/upload-csv", upload.single("file"), async (req, res) => {
    console.log("--> RECEIVED UPLOAD REQUEST");
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "Failed to process file", details: "No file uploaded" });
      }
      const parsed = parseExcel(req.file.buffer);
      console.log(`[upload] parsed: timeslots=${parsed.timeslots.length} rooms=${parsed.rooms.length} lessons=${parsed.lessons.length}`);
      
      // Note: No longer checking for missing meeting links in lessons
      const validation = buildValidation(parsed);
      
      // Do not block uploads on pre-validation conflicts. Proceed to solve and persist only valid results.
      await clearAll();
      
      // Persist entities
      for (const t of parsed.teachers) await storage.createTeacher(t);
      for (const g of parsed.studentGroups) await storage.createStudentGroup(g);
      for (const c of parsed.courses) {
        const code = String(c.name).replace(/\s+/g, "_").toUpperCase();
        await storage.createCourse({ name: c.name, code, duration: 1 });
      }
      
      const dayKeyToUi = new Map([
        ["MONDAY", "Monday"],
        ["TUESDAY", "Tuesday"],
        ["WEDNESDAY", "Wednesday"],
        ["THURSDAY", "Thursday"],
        ["FRIDAY", "Friday"],
      ]);
      
      for (const a of parsed.teacherAvailabilities) {
        const uiDay = dayKeyToUi.get(String(a.dayOfWeek)) || String(a.dayOfWeek);
        await storage.createTeacherAvailability({ teacher: a.teacher, day: uiDay, startTime: a.startTime, endTime: a.endTime });
      }
      
      console.log("=== UPLOAD: CALLING TIMEFOLD SOLVER ===");
      const { jobId } = await startAndPollSolve({ 
        timeslots: parsed.timeslots, 
        rooms: parsed.rooms, 
        lessons: parsed.lessons, 
        teacherAvailabilities: parsed.teacherAvailabilities 
      }, parsed.lessons);
      
      res.json({ 
        message: "Upload accepted; solving in background", 
        summary: { 
          teachers: parsed.teachers.length, 
          studentGroups: parsed.studentGroups.length, 
          courses: parsed.courses.length, 
          lessons: parsed.lessons.length,
          timeslots: parsed.timeslots.length,
          rooms: parsed.rooms.length,
          teacherAvailabilities: parsed.teacherAvailabilities.length
        }, 
        data: parsed, 
        jobId, 
        warnings: validation.warnings,
        conflicts: validation.conflicts, 
        suggestions: validation.suggestions 
      });
      
    } catch (e: any) {
      console.error(`[upload] error:`, e);
      res.status(400).json({ 
        error: "Failed to process file", 
        details: e?.message || String(e) 
      });
    }
  });

  app.post("/api/solve", async (req, res) => {
    const body = (req.body as any) || {};
    const { jobId } = await startAndPollSolve(body, (body?.lessons as any[]) || []);
    res.status(202).json({ jobId });
  });

  app.get("/api/solution", async (req, res) => {
    const jobId = String((req.query as any)?.jobId || "");
    try {
      const solution = await getSolution(jobId);
      res.json(solution);
    } catch (e: any) {
      res.status(502).json({ error: "Solver error", details: e?.message || String(e) });
    }
  });
  
  app.get("/api/solution/status", async (req, res) => {
    const jobId = String((req.query as any)?.jobId || "");
    try {
      const status = await getStatus(jobId);
      res.json(status);
    } catch (e: any) {
      res.status(502).json({ error: "Solver error", details: e?.message || String(e) });
    }
  });

  return app;
}
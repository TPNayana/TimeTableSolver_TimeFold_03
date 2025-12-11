import express from "express";
import cors from "cors";

type Timeslot = { id: string; dayOfWeek: string; startTime: string; endTime?: string };
type Lesson = { id: string; subject: string; teacher: string; studentGroup: string; timeslot?: string; room?: string };
type Availability = { teacher: string; dayOfWeek: string; startTime: string; endTime: string };

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cors());

type Job = {
  timetable: { timeslots: Timeslot[]; rooms: { id: string; name?: string }[]; lessons: Lesson[]; teacherAvailabilities: Availability[] };
  solution?: { timeslots: Timeslot[]; lessons: Lesson[] };
};

const jobs = new Map<string, Job>();

function allowedTimeslotsForTeacher(ts: Timeslot[], avs: Availability[], teacher: string) {
  const windows = avs.filter((a) => String(a.teacher) === String(teacher));
  return ts.filter((slot) => windows.some((w) => String(w.dayOfWeek) === String(slot.dayOfWeek) && slot.startTime >= w.startTime && (slot.endTime || "") <= w.endTime));
}

function addMinutes(t: string, minutes: number) {
  const [h, m] = String(t).split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return !(aEnd <= bStart || aStart >= bEnd);
}

function scheduleGreedy(timetable: Job["timetable"]) {
  const lessons: Lesson[] = timetable.lessons.map((l) => ({ ...l }));
  const timeslots = timetable.timeslots.map((t) => ({ ...t, endTime: t.endTime || addMinutes(t.startTime, 60) }));
  const tsById = new Map<string, Timeslot>(timeslots.map((t) => [String(t.id), t]));

  const usedTeacherBySlot = new Map<string, Set<string>>(); // key: timeslotId, value: teacher names
  const usedGroupBySlot = new Map<string, Set<string>>();   // key: timeslotId, value: group names
  const usedRoomBySlot = new Map<string, Set<string>>();    // key: timeslotId, value: room ids

  // Track per-day time intervals for teachers and groups to prevent overlaps across different slot IDs
  const teacherDayIntervals = new Map<string, Map<string, Array<{ start: string; end: string }>>>();
  const groupDayIntervals = new Map<string, Map<string, Array<{ start: string; end: string }>>>();

  // Helper to choose a room that is free in this timeslot
  function pickFreeRoom(slotId: string): string | undefined {
    const used = usedRoomBySlot.get(slotId) || new Set<string>();
    const room = timetable.rooms.find((r) => !used.has(String(r.id)));
    return room ? String(room.id) : undefined;
  }

  // Spread lessons across the week: count per day per teacher
  const teacherDayLoad = new Map<string, Map<string, number>>();

  for (const l of lessons) {
    const allowed = allowedTimeslotsForTeacher(timeslots as Timeslot[], timetable.teacherAvailabilities, l.teacher);
    // Sort allowed to prefer lower current teacher day load first, then earlier time
    const loads = teacherDayLoad.get(l.teacher) || new Map<string, number>();
    const sorted = allowed.slice().sort((a, b) => {
      const la = (loads.get(a.dayOfWeek) || 0);
      const lb = (loads.get(b.dayOfWeek) || 0);
      if (la !== lb) return la - lb;
      return String(a.startTime).localeCompare(String(b.startTime));
    });
    let assigned = false;
    for (const slot of sorted) {
      const slotId = String(slot.id);
      const teacherSet = usedTeacherBySlot.get(slotId) || new Set<string>();
      const groupSet = usedGroupBySlot.get(slotId) || new Set<string>();
      if (teacherSet.has(l.teacher)) continue; // teacher already teaching something in this slot
      if (groupSet.has(l.studentGroup)) continue; // group already busy in this slot

      // Prevent overlaps across different slot IDs by checking existing intervals for the day
      const tDayMap = teacherDayIntervals.get(l.teacher) || new Map<string, Array<{ start: string; end: string }>>();
      const gDayMap = groupDayIntervals.get(l.studentGroup) || new Map<string, Array<{ start: string; end: string }>>();
      const tIntervals = tDayMap.get(slot.dayOfWeek) || [];
      const gIntervals = gDayMap.get(slot.dayOfWeek) || [];
      const willOverlapTeacher = tIntervals.some(iv => overlaps(iv.start, iv.end, slot.startTime, slot.endTime!));
      const willOverlapGroup = gIntervals.some(iv => overlaps(iv.start, iv.end, slot.startTime, slot.endTime!));
      if (willOverlapTeacher || willOverlapGroup) continue;

      const roomId = pickFreeRoom(slotId);
      if (!roomId) continue; // no room available in this slot

      // Assign
      l.timeslot = slotId;
      l.room = roomId;

      // Mark slot occupancy
      teacherSet.add(l.teacher);
      groupSet.add(l.studentGroup);
      const roomSet = usedRoomBySlot.get(slotId) || new Set<string>();
      roomSet.add(roomId);
      usedTeacherBySlot.set(slotId, teacherSet);
      usedGroupBySlot.set(slotId, groupSet);
      usedRoomBySlot.set(slotId, roomSet);

      // Track day intervals for overlap prevention
      tIntervals.push({ start: slot.startTime, end: slot.endTime! });
      gIntervals.push({ start: slot.startTime, end: slot.endTime! });
      tDayMap.set(slot.dayOfWeek, tIntervals);
      gDayMap.set(slot.dayOfWeek, gIntervals);
      teacherDayIntervals.set(l.teacher, tDayMap);
      groupDayIntervals.set(l.studentGroup, gDayMap);

      const load = loads.get(slot.dayOfWeek) || 0;
      loads.set(slot.dayOfWeek, load + 1);
      teacherDayLoad.set(l.teacher, loads);
      assigned = true;
      break;
    }
    if (!assigned) {
      // leave lesson unscheduled if no valid slot-room combo exists
      l.timeslot = undefined;
      l.room = undefined;
    }
  }
  return { timeslots, lessons };
}

app.post("/timetables", (req, res) => {
  const timetable = (req.body || {}) as Job["timetable"];
  const jobId = `job-${Date.now()}`;
  const job: Job = { timetable };
  job.solution = scheduleGreedy(timetable);
  jobs.set(jobId, job);
  res.json({ jobId });
});

app.get("/timetables/:jobId/status", (req, res) => {
  const jobId = String(req.params.jobId);
  if (!jobs.has(jobId)) return res.status(404).json({ error: "Job not found" });
  res.json({ solverStatus: "NOT_SOLVING" });
});

app.get("/timetables/:jobId", (req, res) => {
  const jobId = String(req.params.jobId);
  const job = jobs.get(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job.solution || { timeslots: [], lessons: [] });
});

const port = Number(process.env.SOLVER_MOCK_PORT || 8081);
app.listen(port, () => {
  console.log(`[mock-solver] listening on ${port}`);
});

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTeacherSchema,
  insertStudentGroupSchema,
  insertCourseSchema,
  insertClassSchema,
} from "@shared/schema";
import { detectConflicts, generateSmartSuggestions } from "./conflictDetection";
import { parseCSV, parseExcel } from "./csvParser";
import { solveSchedule } from "./timefoldClient";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Teachers
  app.get("/api/teachers", async (req, res) => {
    const teachers = await storage.getAllTeachers();
    res.json(teachers);
  });

  app.get("/api/teachers/:id", async (req, res) => {
    const teacher = await storage.getTeacher(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.json(teacher);
  });

  app.post("/api/teachers", async (req, res) => {
    const result = insertTeacherSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const teacher = await storage.createTeacher(result.data);
    res.status(201).json(teacher);
  });

  app.patch("/api/teachers/:id", async (req, res) => {
    const teacher = await storage.updateTeacher(req.params.id, req.body);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.json(teacher);
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    const deleted = await storage.deleteTeacher(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.status(204).send();
  });

  // Student Groups
  app.get("/api/student-groups", async (req, res) => {
    const groups = await storage.getAllStudentGroups();
    res.json(groups);
  });

  app.get("/api/student-groups/:id", async (req, res) => {
    const group = await storage.getStudentGroup(req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Student group not found" });
    }
    res.json(group);
  });

  app.post("/api/student-groups", async (req, res) => {
    const result = insertStudentGroupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const group = await storage.createStudentGroup(result.data);
    res.status(201).json(group);
  });

  app.patch("/api/student-groups/:id", async (req, res) => {
    const group = await storage.updateStudentGroup(req.params.id, req.body);
    if (!group) {
      return res.status(404).json({ error: "Student group not found" });
    }
    res.json(group);
  });

  app.delete("/api/student-groups/:id", async (req, res) => {
    const deleted = await storage.deleteStudentGroup(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Student group not found" });
    }
    res.status(204).send();
  });

  // Courses
  app.get("/api/courses", async (req, res) => {
    const courses = await storage.getAllCourses();
    res.json(courses);
  });

  app.get("/api/courses/:id", async (req, res) => {
    const course = await storage.getCourse(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  });

  app.post("/api/courses", async (req, res) => {
    const result = insertCourseSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const course = await storage.createCourse(result.data);
    res.status(201).json(course);
  });

  app.patch("/api/courses/:id", async (req, res) => {
    const course = await storage.updateCourse(req.params.id, req.body);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  });

  app.delete("/api/courses/:id", async (req, res) => {
    const deleted = await storage.deleteCourse(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(204).send();
  });

  // Classes
  app.get("/api/classes", async (req, res) => {
    const classes = await storage.getAllClasses();
    res.json(classes);
  });

  // Classes with full details (enriched with teacher, course, student group names)
  app.get("/api/classes/enriched", async (req, res) => {
    const classes = await storage.getAllClasses();
    const teachers = await storage.getAllTeachers();
    const courses = await storage.getAllCourses();
    const studentGroups = await storage.getAllStudentGroups();

    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const groupMap = new Map(studentGroups.map(g => [g.id, g]));

    const enriched = classes.map(c => ({
      id: c.id,
      courseName: courseMap.get(c.courseId)?.name || 'Unknown',
      courseCode: courseMap.get(c.courseId)?.code || 'Unknown',
      teacherName: teacherMap.get(c.teacherId)?.name || 'Unknown',
      studentGroup: groupMap.get(c.studentGroupId)?.name || 'Unknown',
      day: c.day,
      startTime: c.startTime,
      endTime: c.endTime,
      hasConflict: c.hasConflict || false,
      // Include IDs for updates
      courseId: c.courseId,
      teacherId: c.teacherId,
      studentGroupId: c.studentGroupId,
    }));

    res.json(enriched);
  });

  app.get("/api/classes/:id", async (req, res) => {
    const classData = await storage.getClass(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }
    res.json(classData);
  });

  app.post("/api/classes", async (req, res) => {
    const result = insertClassSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Check for conflicts
    const existingClasses = await storage.getAllClasses();
    const conflictInfo = detectConflicts(result.data, existingClasses);

    const classData = await storage.createClass({
      ...result.data,
      hasConflict: conflictInfo.hasConflict,
    });

    res.status(201).json({
      ...classData,
      conflictInfo,
    });
  });

  app.patch("/api/classes/:id", async (req, res) => {
    const existing = await storage.getClass(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Check for conflicts with updated data
    const updatedData = { ...existing, ...req.body, id: req.params.id };
    const existingClasses = await storage.getAllClasses();
    const conflictInfo = detectConflicts(updatedData, existingClasses);

    const classData = await storage.updateClass(req.params.id, {
      ...req.body,
      hasConflict: conflictInfo.hasConflict,
    });

    res.json({
      ...classData,
      conflictInfo,
    });
  });

  app.delete("/api/classes/:id", async (req, res) => {
    const deleted = await storage.deleteClass(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Class not found" });
    }
    res.status(204).send();
  });

  // CSV/Excel Upload
  app.post("/api/upload-csv", upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      let parsedData;
      const fileName = req.file.originalname.toLowerCase();
      
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        parsedData = parseExcel(req.file.buffer);
      } else if (fileName.endsWith('.csv')) {
        const csvContent = req.file.buffer.toString('utf-8');
        parsedData = parseCSV(csvContent);
      } else {
        return res.status(400).json({ 
          error: "Unsupported file format", 
          details: "Please upload a CSV or Excel (.xlsx/.xls) file"
        });
      }

      console.log("=== PARSED EXCEL ROWS ===", JSON.stringify(parsedData, null, 2));

      // Create teachers
      const teacherMap = new Map<string, string>();
      for (const teacher of parsedData.teachers) {
        const existing = (await storage.getAllTeachers()).find(t => t.name === teacher.name);
        if (existing) {
          teacherMap.set(teacher.name, existing.id);
        } else {
          const created = await storage.createTeacher(teacher);
          teacherMap.set(teacher.name, created.id);
        }
      }

      // Create student groups
      const studentGroupMap = new Map<string, string>();
      for (const group of parsedData.studentGroups) {
        const existing = (await storage.getAllStudentGroups()).find(g => g.name === group.name);
        if (existing) {
          studentGroupMap.set(group.name, existing.id);
        } else {
          const created = await storage.createStudentGroup(group);
          studentGroupMap.set(group.name, created.id);
        }
      }

      // Create courses
      const courseMap = new Map<string, string>();
      for (const course of parsedData.courses) {
        const existing = (await storage.getAllCourses()).find(c => c.code === course.code);
        if (existing) {
          courseMap.set(course.code, existing.id);
        } else {
          const created = await storage.createCourse(course);
          courseMap.set(course.code, created.id);
        }
      }

      // Delete existing classes to avoid conflicts
      const allClasses = await storage.getAllClasses();
      for (const classItem of allClasses) {
        await storage.deleteClass(classItem.id);
      }

      // Build assignment list - use assignments array if available, otherwise build from schedules
      const assignmentsToSolve = [];
      const assignmentSource = parsedData.assignments || parsedData.schedules || [];

      console.log(`\n=== CSV PARSING DEBUG ===`);
      console.log(`Parsed ${parsedData.teachers.length} teachers`);
      console.log(`Parsed ${parsedData.studentGroups.length} student groups`);
      console.log(`Parsed ${parsedData.courses.length} courses`);
      console.log(`Found ${parsedData.schedules?.length || 0} schedules with times`);
      console.log(`Found ${parsedData.assignments?.length || 0} assignments (for Timefold)`);

      for (const item of assignmentSource) {
        const courseId = courseMap.get(item.courseCode);
        const teacherId = teacherMap.get(item.teacherName);
        const studentGroupId = studentGroupMap.get(item.studentGroup);

        if (courseId && teacherId && studentGroupId) {
          const course = await storage.getCourse(courseId);
          const teacher = await storage.getTeacher(teacherId);
          const group = await storage.getStudentGroup(studentGroupId);

          assignmentsToSolve.push({
            courseId,
            courseCode: item.courseCode,
            courseName: course?.name || "Unknown Course",
            teacherId,
            teacherName: teacher?.name || "Unknown Teacher",
            studentGroupId,
            studentGroupName: group?.name || "Unknown Group",
            department: course?.department || "",
          });
        }
      }

      console.log(`\nBuilt ${assignmentsToSolve.length} assignments for Timefold solver`);
      assignmentsToSolve.forEach((a, idx) => {
        console.log(`  [${idx + 1}] ${a.courseName} (${a.courseCode}) - Teacher: ${a.teacherName} - Group: ${a.studentGroupName}`);
      });

      const createdClasses = [];

      // Call Timefold solver
      if (assignmentsToSolve.length > 0) {
        console.log("\n=== UPLOAD: CALLING TIMEFOLD SOLVER ===");
        const solvedClasses = await solveSchedule(assignmentsToSolve);

        console.log(`\nTimefold returned ${solvedClasses.length} scheduled classes`);
        solvedClasses.forEach((c, idx) => {
          console.log(`  [${idx + 1}] ${c.day} ${c.startTime}-${c.endTime}`);
        });

        // Save solved classes to database
        for (const classData of solvedClasses) {
          const created = await storage.createClass({
            courseId: classData.courseId,
            teacherId: classData.teacherId,
            studentGroupId: classData.studentGroupId,
            day: classData.day,
            startTime: classData.startTime,
            endTime: classData.endTime,
            hasConflict: classData.hasConflict,
          });
          createdClasses.push(created);
        }
      } else {
        console.log("WARNING: No assignments found to schedule");
      }

      res.json({
        message: "File processed successfully - schedule solved by Timefold",
        summary: {
          teachers: parsedData.teachers.length,
          studentGroups: parsedData.studentGroups.length,
          courses: parsedData.courses.length,
          classesScheduled: createdClasses.length,
        },
        teacherIds: Object.fromEntries(teacherMap),
        studentGroupIds: Object.fromEntries(studentGroupMap),
        courseIds: Object.fromEntries(courseMap),
        scheduledClasses: createdClasses,
      });
    } catch (error) {
      console.error("PARSE ERROR DETAILS:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Check if it's a Timefold connection error
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('127.0.0.1:8080')) {
        res.status(503).json({ 
          error: "Timefold solver service unavailable", 
          details: "The Timefold Java backend service is not running on localhost:8080. Please start it following TIMEFOLD_SETUP.md instructions.",
          hint: "Make sure Timefold is running: java -jar timefold-solver-springboot-2.0.0.jar"
        });
      } else {
        res.status(400).json({ 
          error: "Failed to process file", 
          details: errorMsg 
        });
      }
    }
  });

  // Auto-Schedule (using Timefold solver)
  app.post("/api/schedule/generate", async (req, res) => {
    const { assignments } = req.body; // Array of { courseId, teacherId, studentGroupId }

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: "Assignments array is required" });
    }

    try {
      // Enrich assignments with names for Timefold solver
      const teachers = await storage.getAllTeachers();
      const courses = await storage.getAllCourses();
      const studentGroups = await storage.getAllStudentGroups();

      const teacherMap = new Map(teachers.map(t => [t.id, t]));
      const courseMap = new Map(courses.map(c => [c.id, c]));
      const groupMap = new Map(studentGroups.map(g => [g.id, g]));

      const enrichedAssignments = assignments.map((assignment: any) => {
        const course = courseMap.get(assignment.courseId);
        const teacher = teacherMap.get(assignment.teacherId);
        const group = groupMap.get(assignment.studentGroupId);

        return {
          courseId: assignment.courseId,
          courseCode: course?.code || "UNKNOWN",
          courseName: course?.name || "Unknown Course",
          teacherId: assignment.teacherId,
          teacherName: teacher?.name || "Unknown Teacher",
          studentGroupId: assignment.studentGroupId,
          studentGroupName: group?.name || "Unknown Group",
          department: course?.department || "",
        };
      });

      // Call Timefold solver
      const scheduledClasses = await solveSchedule(enrichedAssignments);

      // Save to database
      const saved = [];
      for (const classData of scheduledClasses) {
        const created = await storage.createClass({
          courseId: classData.courseId,
          teacherId: classData.teacherId,
          studentGroupId: classData.studentGroupId,
          day: classData.day,
          startTime: classData.startTime,
          endTime: classData.endTime,
          hasConflict: classData.hasConflict,
        });
        saved.push(created);
      }

      res.json({
        message: "Schedule generated successfully by Timefold solver",
        scheduled: saved.length,
        total: assignments.length,
        classes: saved,
      });
    } catch (error) {
      console.error("Scheduling error:", error);
      res.status(500).json({ 
        error: "Failed to generate schedule",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Conflict Detection & Smart Suggestions
  app.post("/api/classes/check-conflicts", async (req, res) => {
    const { teacherId, studentGroupId, day, startTime, endTime, excludeClassId } = req.body;

    if (!teacherId || !studentGroupId || !day || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingClasses = await storage.getAllClasses();
    const conflictInfo = detectConflicts(
      { teacherId, studentGroupId, day, startTime, endTime, id: excludeClassId },
      existingClasses
    );

    res.json(conflictInfo);
  });

  app.post("/api/classes/smart-suggestions", async (req, res) => {
    const { teacherId, studentGroupId, excludeClassId } = req.body;

    if (!teacherId || !studentGroupId) {
      return res.status(400).json({ error: "Teacher and student group are required" });
    }

    const existingClasses = await storage.getAllClasses();
    const suggestions = generateSmartSuggestions(
      teacherId,
      studentGroupId,
      existingClasses,
      excludeClassId
    );

    res.json(suggestions);
  });

  // Export schedule as CSV
  app.get("/api/export/schedule", async (req, res) => {
    const classes = await storage.getAllClasses();
    const teachers = await storage.getAllTeachers();
    const courses = await storage.getAllCourses();
    const studentGroups = await storage.getAllStudentGroups();

    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const groupMap = new Map(studentGroups.map(g => [g.id, g]));

    // Create CSV header
    const csvLines = [
      'Course Name,Course Code,Teacher Name,Student Group,Day,Start Time,End Time,Has Conflict'
    ];

    // Add data rows
    for (const c of classes) {
      const courseName = courseMap.get(c.courseId)?.name || 'Unknown';
      const courseCode = courseMap.get(c.courseId)?.code || 'Unknown';
      const teacherName = teacherMap.get(c.teacherId)?.name || 'Unknown';
      const studentGroup = groupMap.get(c.studentGroupId)?.name || 'Unknown';
      const hasConflict = c.hasConflict ? 'Yes' : 'No';

      csvLines.push(
        `"${courseName}","${courseCode}","${teacherName}","${studentGroup}","${c.day}","${c.startTime}","${c.endTime}","${hasConflict}"`
      );
    }

    const csvContent = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="timetable-schedule.csv"');
    res.send(csvContent);
  });

  const httpServer = createServer(app);

  return httpServer;
}

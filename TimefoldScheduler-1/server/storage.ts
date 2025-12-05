import {
  type Teacher,
  type InsertTeacher,
  type StudentGroup,
  type InsertStudentGroup,
  type Course,
  type InsertCourse,
  type Class,
  type InsertClass,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Teachers
  getTeacher(id: string): Promise<Teacher | undefined>;
  getAllTeachers(): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: string): Promise<boolean>;

  // Student Groups
  getStudentGroup(id: string): Promise<StudentGroup | undefined>;
  getAllStudentGroups(): Promise<StudentGroup[]>;
  createStudentGroup(group: InsertStudentGroup): Promise<StudentGroup>;
  updateStudentGroup(id: string, group: Partial<InsertStudentGroup>): Promise<StudentGroup | undefined>;
  deleteStudentGroup(id: string): Promise<boolean>;

  // Courses
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;

  // Classes
  getClass(id: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: string): Promise<boolean>;
  getClassesByDay(day: string): Promise<Class[]>;
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  getClassesByStudentGroup(studentGroupId: string): Promise<Class[]>;

  // Teacher Availability
  getAllTeacherAvailabilities(): Promise<Array<{ id: string; teacher: string; day: string; startTime: string; endTime: string }>>;
  createTeacherAvailability(a: { teacher: string; day: string; startTime: string; endTime: string }): Promise<{ id: string; teacher: string; day: string; startTime: string; endTime: string }>;
  deleteTeacherAvailability(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private teachers: Map<string, Teacher>;
  private studentGroups: Map<string, StudentGroup>;
  private courses: Map<string, Course>;
  private classes: Map<string, Class>;
  private teacherAvailabilities: Map<string, { id: string; teacher: string; day: string; startTime: string; endTime: string }>;

  constructor() {
    this.teachers = new Map();
    this.studentGroups = new Map();
    this.courses = new Map();
    this.classes = new Map();
    this.teacherAvailabilities = new Map();
  }

  // Teachers
  async getTeacher(id: string): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async getAllTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const id = randomUUID();
    const newTeacher: Teacher = { 
      id,
      name: teacher.name,
      email: teacher.email ?? null,
      department: teacher.department ?? null,
    };
    this.teachers.set(id, newTeacher);
    return newTeacher;
  }

  async updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const existing = this.teachers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...teacher };
    this.teachers.set(id, updated);
    return updated;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    return this.teachers.delete(id);
  }

  // Student Groups
  async getStudentGroup(id: string): Promise<StudentGroup | undefined> {
    return this.studentGroups.get(id);
  }

  async getAllStudentGroups(): Promise<StudentGroup[]> {
    return Array.from(this.studentGroups.values());
  }

  async createStudentGroup(group: InsertStudentGroup): Promise<StudentGroup> {
    const id = randomUUID();
    const newGroup: StudentGroup = {
      id,
      name: group.name,
      department: group.department ?? null,
      yearLevel: group.yearLevel ?? null,
    };
    this.studentGroups.set(id, newGroup);
    return newGroup;
  }

  async updateStudentGroup(id: string, group: Partial<InsertStudentGroup>): Promise<StudentGroup | undefined> {
    const existing = this.studentGroups.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...group };
    this.studentGroups.set(id, updated);
    return updated;
  }

  async deleteStudentGroup(id: string): Promise<boolean> {
    return this.studentGroups.delete(id);
  }

  // Courses
  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const newCourse: Course = {
      id,
      name: course.name,
      code: course.code,
      department: course.department ?? null,
      duration: course.duration ?? 1,
    };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const existing = this.courses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...course };
    this.courses.set(id, updated);
    return updated;
  }

  async deleteCourse(id: string): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Classes
  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const id = randomUUID();
    const newClass: Class = {
      id,
      courseId: classData.courseId,
      teacherId: classData.teacherId,
      studentGroupId: classData.studentGroupId,
      day: classData.day,
      startTime: classData.startTime,
      endTime: classData.endTime,
      hasConflict: classData.hasConflict ?? null,
      meetingLink: (classData as any).meetingLink ?? null,
    };
    this.classes.set(id, newClass);
    return newClass;
  }

  async updateClass(id: string, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const existing = this.classes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...classData };
    this.classes.set(id, updated);
    return updated;
  }

  async deleteClass(id: string): Promise<boolean> {
    return this.classes.delete(id);
  }

  async getClassesByDay(day: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(c => c.day === day);
  }

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(c => c.teacherId === teacherId);
  }

  async getClassesByStudentGroup(studentGroupId: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(c => c.studentGroupId === studentGroupId);
  }

  async getAllTeacherAvailabilities(): Promise<Array<{ id: string; teacher: string; day: string; startTime: string; endTime: string }>> {
    return Array.from(this.teacherAvailabilities.values());
  }

  async createTeacherAvailability(a: { teacher: string; day: string; startTime: string; endTime: string }): Promise<{ id: string; teacher: string; day: string; startTime: string; endTime: string }> {
    const id = randomUUID();
    const rec = { id, teacher: a.teacher, day: a.day, startTime: a.startTime, endTime: a.endTime };
    this.teacherAvailabilities.set(id, rec);
    return rec;
  }

  async deleteTeacherAvailability(id: string): Promise<boolean> {
    return this.teacherAvailabilities.delete(id);
  }
}

export const storage = new MemStorage();

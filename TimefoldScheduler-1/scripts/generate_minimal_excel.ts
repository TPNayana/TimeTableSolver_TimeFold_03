import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "assets");
const outPath = path.join(outDir, "minimal_timetable.xlsx");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function makeTimeslots() {
  const headers = ["DayOfWeek", "StartTime", "EndTime"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const rows: any[] = [headers];
  for (const d of days) {
    for (let h = 9; h < 12; h++) {
      rows.push([d, `${String(h).padStart(2, "0")}:00`, `${String(h + 1).padStart(2, "0")}:00`]);
    }
  }
  return XLSX.utils.aoa_to_sheet(rows);
}

function makeRooms() {
  const rows = XLSX.utils.aoa_to_sheet([["Name"], ["Room A"], ["Room B"]]);
  return rows;
}

function makeLessons() {
  const rows = XLSX.utils.aoa_to_sheet([
    ["Id", "Subject", "Teacher", "StudentGroup"],
    ["L1", "Mathematics", "Alice", "G1"],
    ["L2", "Physics", "Bob", "G2"],
  ]);
  return rows;
}

function makeAvailability() {
  const rows = XLSX.utils.aoa_to_sheet([
    ["Teacher", "DayOfWeek", "StartTime", "EndTime"],
    ["Alice", "Monday", "09:00", "12:00"],
    ["Bob", "Tuesday", "09:00", "12:00"],
  ]);
  return rows;
}

function main() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeTimeslots(), "Timeslots");
  XLSX.utils.book_append_sheet(wb, makeRooms(), "Room");
  XLSX.utils.book_append_sheet(wb, makeLessons(), "Lesson");
  XLSX.utils.book_append_sheet(wb, makeAvailability(), "TeacherAvailability");
  ensureDir(outDir);
  XLSX.writeFile(wb, outPath);
  console.log(`Wrote minimal Excel template at: ${outPath}`);
}

main();


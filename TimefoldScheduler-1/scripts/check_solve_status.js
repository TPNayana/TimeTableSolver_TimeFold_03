// Real-time solve lifecycle check script
// Usage: node scripts/check_solve_status.js
// Optional env: SOLVER_API_URL (default http://127.0.0.1:8080), SOLVER_API_TOKEN

import fs from 'node:fs';
import path from 'node:path';

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:5000';
const SOLVER_BASE = process.env.SOLVER_API_URL || 'http://127.0.0.1:8080';
const TOKEN = process.env.SOLVER_API_TOKEN || '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadTimetable() {
  const filePath = path.resolve('assets/minimal_timetable.xlsx');
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const fileBuf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([fileBuf]), 'minimal_timetable.xlsx');

  const res = await fetch(`${API_BASE}/api/upload-csv`, {
    method: 'POST',
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response: ${text}`);
  }
  const jobId = json?.jobId;
  if (!jobId) {
    throw new Error(`Missing jobId in response: ${text}`);
  }
  return { jobId, summary: json?.summary };
}

async function getStatus(jobId) {
  const headers = {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(`${SOLVER_BASE}/timetables/${encodeURIComponent(jobId)}/status`, {
    method: 'GET',
    headers,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Status error (${res.status}): ${text}`);
  const json = JSON.parse(text);
  return json;
}

async function getSolution(jobId) {
  const headers = {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(`${SOLVER_BASE}/timetables/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Solution error (${res.status}): ${text}`);
  const json = JSON.parse(text);
  return json;
}

function isTerminalStatus(statusObj) {
  const solverStatus = String(statusObj?.solverStatus || '').toUpperCase();
  const generalStatus = String(statusObj?.status || '').toUpperCase();
  if (solverStatus === 'STOPPED' || solverStatus === 'NOT_SOLVING') return true;
  if (generalStatus === 'SOLVED' || generalStatus === 'UNSOLVED') return true;
  return false;
}

function countScheduledLessons(solution) {
  const lessons = Array.isArray(solution?.lessons) ? solution.lessons : [];
  return lessons.filter((l) => l?.timeslot != null).length;
}

async function main() {
  try {
    console.log(`Uploading timetable to ${API_BASE}/api/upload-csv ...`);
    const { jobId, summary } = await uploadTimetable();
    console.log(`Upload successful. jobId=${jobId}`);
    if (summary) console.log(`Summary:`, summary);

    const start = Date.now();
    let tick = 0;
    while (true) {
      await sleep(2000);
      tick += 2;
      let statusObj;
      try {
        statusObj = await getStatus(jobId);
      } catch (e) {
        console.log(`Time: ${tick}s - Status: ERROR (${e.message})`);
        continue;
      }
      const solverStatus = String(statusObj?.solverStatus || 'UNKNOWN');
      console.log(`Time: ${tick}s - Status: ${solverStatus}`);
      if (isTerminalStatus(statusObj)) {
        const solution = await getSolution(jobId);
        const scheduled = countScheduledLessons(solution);
        console.log(`Optimization complete! Scheduled ${scheduled} lessons.`);
        break;
      }
    }
    process.exit(0);
  } catch (e) {
    console.error(`check_solve_status error:`, e.message || e);
    process.exit(1);
  }
}

main();


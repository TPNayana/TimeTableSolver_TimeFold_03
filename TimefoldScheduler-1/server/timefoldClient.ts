import http from "http";
import https from "https";

const SOLVER_API_URL = process.env.SOLVER_API_URL || "http://127.0.0.1:8081";
const SOLVER_API_TOKEN = process.env.SOLVER_API_TOKEN || "";

function authHeaders(extra?: Record<string, string>) {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (SOLVER_API_TOKEN) headers["Authorization"] = `Bearer ${SOLVER_API_TOKEN}`;
  return headers;
}

function requestRaw(method: string, url: string, body?: string, headers?: Record<string, string>) {
  return new Promise<string>((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request({ method, hostname: u.hostname, port: u.port, path: u.pathname + u.search, headers }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`POST ${url} failed: ${res.statusCode} ${data}`));
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function postText(path: string, text: string) {
  const url = `${SOLVER_API_URL}${path}`;
  console.log("=== TIMEFOLD SOLVER CALLED ===", { url, bytes: Buffer.byteLength(text || "") });
  return requestRaw("POST", url, text, authHeaders({ "Content-Type": "application/json" }));
}
export async function getJson(path: string) {
  const url = `${SOLVER_API_URL}${path}`;
  const raw = await requestRaw("GET", url, undefined, authHeaders());
  console.log("=== TIMEFOLD SOLVER RESPONSE RECEIVED ===", { url, size: raw.length });
  return JSON.parse(raw);
}

export async function startSolve(timetable: unknown) {
  const raw = await postText("/timetables", JSON.stringify(timetable));
  const trimmedRaw = String(raw).trim();
  // HEURISTIC: Timefold can return a raw Job ID string or a JSON object.
  if (trimmedRaw.startsWith("{")) {
    return JSON.parse(trimmedRaw);
  } else {
    // If it's not JSON, assume it is the raw Job ID string
    return { jobId: trimmedRaw } as any;
  }
}
export async function getSolution(jobId: string) {
  return getJson(`/timetables/${encodeURIComponent(jobId)}`);
}
export async function getStatus(jobId: string) {
  return getJson(`/timetables/${encodeURIComponent(jobId)}/status`);
}

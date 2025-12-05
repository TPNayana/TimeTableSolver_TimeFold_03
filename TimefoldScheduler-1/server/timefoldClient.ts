import http from "http";
import https from "https";

const SOLVER_API_URL = process.env.SOLVER_API_URL || "http://127.0.0.1:8081";

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
  return requestRaw("POST", url, text, { "Content-Type": "application/json" });
}
export async function getJson(path: string) {
  const url = `${SOLVER_API_URL}${path}`;
  const raw = await requestRaw("GET", url);
  return JSON.parse(raw);
}

export async function startSolve(timetable: unknown) {
  const raw = await postText("/timetables", JSON.stringify(timetable));
  try {
    const obj = JSON.parse(raw);
    return obj;
  } catch {
    const jobId = String(raw).trim();
    return { jobId } as any;
  }
}
export async function getSolution(jobId: string) {
  return getJson(`/timetables/${encodeURIComponent(jobId)}`);
}
export async function getStatus(jobId: string) {
  return getJson(`/timetables/${encodeURIComponent(jobId)}/status`);
}
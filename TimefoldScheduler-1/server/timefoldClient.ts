import http from "http";
import https from "https";

const SOLVER_API_URL = process.env.SOLVER_API_URL || "http://127.0.0.1:8081";
const SOLVER_API_TOKEN = process.env.SOLVER_API_TOKEN || "";
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

function authHeaders(extra?: Record<string, string>) {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (SOLVER_API_TOKEN) headers["Authorization"] = `Bearer ${SOLVER_API_TOKEN}`;
  return headers;
}

function requestRaw(method: string, url: string, body?: string, headers?: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    
    // Create request options with timeout
    const options: http.RequestOptions = {
      method,
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      headers: { ...authHeaders(), ...headers },
      timeout: REQUEST_TIMEOUT_MS
    };
    
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${method} ${url} failed: ${res.statusCode} ${data}`));
        }
      });
    });
    
    req.on("error", (error) => {
      reject(new Error(`Network error for ${method} ${url}: ${error.message}`));
    });
    
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms for ${method} ${url}`));
    });
    
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

export async function postText(path: string, text: string): Promise<string> {
  const url = `${SOLVER_API_URL}${path}`;
  console.log("=== TIMEFOLD SOLVER CALLED ===", { 
    url, 
    bytes: Buffer.byteLength(text || ""),
    contentPreview: text.length > 200 ? text.substring(0, 200) + "..." : text 
  });
  
  try {
    const response = await requestRaw("POST", url, text, { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    });
    
    console.log("=== TIMEFOLD SOLVER RESPONSE RECEIVED ===", { 
      url, 
      size: response.length,
      responsePreview: response.length > 200 ? response.substring(0, 200) + "..." : response
    });
    
    return response;
  } catch (error: any) {
    console.error("=== TIMEFOLD SOLVER ERROR ===", { 
      url, 
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to connect to Timefold solver at ${url}: ${error.message}`);
  }
}

export async function getJson(path: string): Promise<any> {
  const url = `${SOLVER_API_URL}${path}`;
  
  try {
    const raw = await requestRaw("GET", url, undefined, {
      "Accept": "application/json"
    });
    
    console.log("=== TIMEFOLD SOLVER RESPONSE RECEIVED ===", { 
      url, 
      size: raw.length,
      responsePreview: raw.length > 200 ? raw.substring(0, 200) + "..." : raw
    });
    
    return JSON.parse(raw);
  } catch (error: any) {
    console.error("=== TIMEFOLD SOLVER ERROR ===", { 
      url, 
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to get response from Timefold solver at ${url}: ${error.message}`);
  }
}

export async function startSolve(timetable: unknown): Promise<{ jobId: string }> {
  const raw = await postText("/timetables", JSON.stringify(timetable));
  const trimmedRaw = String(raw).trim();
  
  // HEURISTIC: Timefold can return a raw Job ID string or a JSON object.
  if (trimmedRaw.startsWith("{")) {
    return JSON.parse(trimmedRaw);
  } else {
    // If it's not JSON, assume it is the raw Job ID string
    return { jobId: trimmedRaw };
  }
}

export async function getSolution(jobId: string): Promise<any> {
  return getJson(`/timetables/${encodeURIComponent(jobId)}`);
}

export async function getStatus(jobId: string): Promise<any> {
  return getJson(`/timetables/${encodeURIComponent(jobId)}/status`);
}
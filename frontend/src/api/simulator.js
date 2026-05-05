// api/simulator.js  —  All fetch() calls to the Flask backend in one place

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const json = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
 
/**
 * Open an SSE stream to /run-pipeline.
 * Calls onEvent(parsedEventObject) for each SSE frame received.
 * Returns a Promise that resolves when the stream closes.
 */
export async function runPipeline(body, onEvent) {
  const res = await fetch(`${API}/run-pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop();
    for (const part of parts) {
      if (!part.startsWith("data:")) continue;
      try {
        onEvent(JSON.parse(part.slice(5).trim()));
      } catch {
        /* ignore malformed */
      }
    }
  }
}

// Simulation 
export const runSimulation = (body) =>
  json(`${API}/run-simulation`, body).then((r) => r.json());

// Control
export const terminate = () =>
  json(`${API}/terminate`, {}).then((r) => r.json());

// WKT 
export const testCity = (cityName) =>
  json(`${API}/wkt/test_city`, { city_name: cityName }).then((r) => r.json());

// Configs
export const listConfigs = () => fetch(`${API}/configs`).then((r) => r.json());

export const getConfig = (fn) =>
  fetch(`${API}/configs/${fn}`).then((r) => r.json());

export const saveAll = (settings) =>
  json(`${API}/save-all`, { settings }).then((r) => r.json());

// Post-processing 
export const parseToCSV = (body) =>
  json(`${API}/parse-to-csv`, body).then((r) => r.json());

export const runAverager = (body) =>
  json(`${API}/run-averager`, body).then((r) => r.json());

export const runRegression = (body) =>
  json(`${API}/run-regression`, body).then((r) => r.json());

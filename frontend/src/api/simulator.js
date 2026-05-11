const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const json = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export async function generateReports(body, onEvent) {
  const res = await fetch(`${API}/generate-reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader  = res.body.getReader();
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
      try { onEvent(JSON.parse(part.slice(5).trim())); } catch {}
    }
  }
}

export const runAverager   = () => json(`${API}/run-averager`,  {}).then((r) => r.json());
export const runRegression = () => json(`${API}/run-regression`, {}).then((r) => r.json());
export const terminate     = () => json(`${API}/terminate`,      {}).then((r) => r.json());
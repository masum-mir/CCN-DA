import { useCallback } from "react";

/**
 * Provides addLog() that appends a timestamped entry to s.consoleLogs.
 * @param {Function} setS  — the global setState setter from App
 */
export function useLogger(setS) {
  const addLog = useCallback(
    (msg, level = "info") => {
      const ts = new Date().toTimeString().slice(0, 8);
      setS((p) => ({
        ...p,
        consoleLogs: [...p.consoleLogs, { msg, level, ts }].slice(-200),
      }));
    },
    [setS],
  );

  return { addLog };
}

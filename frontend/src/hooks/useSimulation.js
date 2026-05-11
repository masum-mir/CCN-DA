import { useCallback } from "react";
import { generateReports, runAverager, runRegression, terminate } from "../api/simulator.js";
import { buildSettingsContent, calcBatch } from "./useConfig.js";

function _buildSimBody(s) {
  const content  = buildSettingsContent(s);
  const filename = (s.scenarioName || "TEST") + "_settings.txt";
  return {
    content,
    settings_filename: filename,
    batch_count:       calcBatch(s).total,
    compile:           s.compileFirst,
    _filename:         filename,
  };
}

export function useSimulation(s, upd, addLog, setTab) {

  const handleRun = useCallback(async () => {
    upd("simStatus",    "running");
    upd("results",      null);
    upd("plotResults",  null);
    upd("simError",     "");
    upd("averaged",     null);
    upd("analysis",     null);
    upd("regression",   null);
    upd("pipelineStep", 1);

    const body = _buildSimBody(s);
    addLog(`Settings: ${body._filename}`, "info");
    addLog("Starting pipeline…", "step");

    try {
      let simOk = false;
      await generateReports(body, (ev) => {
        if (ev.type === "log")           addLog(ev.message, ev.level || "output");
        else if (ev.type === "complete") {
          simOk = ev.success;
          addLog(ev.message, ev.success ? "success" : "error");
        }
      });
      if (!simOk) {
        upd("simStatus",    "error");
        upd("simError",     "Simulation failed — check console");
        upd("pipelineStep", null);
        return;
      }
    } catch (err) {
      addLog(err.message, "error");
      upd("simStatus",    "error");
      upd("simError",     err.message);
      upd("pipelineStep", null);
      return;
    }

    upd("pipelineStep", 2);
    addLog("Running Averager…", "step");
    try {
      const avgRes = await runAverager();
      if (avgRes.success) {
        addLog(avgRes.message, "success");
        if (avgRes.averaged) upd("averaged", avgRes.averaged);
      } else {
        addLog(avgRes.message || "Averager failed", "error");
      }
    } catch (err) {
      addLog(`Averager: ${err.message}`, "error");
    }

    upd("pipelineStep", 3);
    addLog("Running Analysis…", "step");
    try {
      const regRes = await runRegression();
      if (regRes.success) {
        addLog(regRes.message, "success");
        if (regRes.plot_results) upd("plotResults", regRes.plot_results);
        if (regRes.regression)   upd("regression",  regRes.regression);
        if (regRes.analysis)     upd("analysis",    regRes.analysis);
        if (regRes.plots_base)   upd("plotsDir",    regRes.plots_base);
      } else {
        addLog(regRes.message || "Analysis failed", "error");
      }
    } catch (err) {
      addLog(`Analysis: ${err.message}`, "error");
    }

    upd("simStatus",    "done");
    upd("pipelineStep", null);
    addLog("Pipeline complete", "success");
    setTimeout(() => setTab("DataAnalysis"), 800);
  }, [s, upd, addLog, setTab]);

  const handleRunSimOnly = useCallback(async () => {
    upd("simStatus",    "running");
    upd("simError",     "");
    upd("pipelineStep", 1);

    const body = _buildSimBody(s);
    addLog(`Settings: ${body._filename}`, "info");
    addLog("Running ONE simulator…", "step");

    try {
      let simOk = false;
      await generateReports(body, (ev) => {
        if (ev.type === "log")           addLog(ev.message, ev.level || "output");
        else if (ev.type === "complete") { simOk = ev.success; addLog(ev.message, ev.success ? "success" : "error"); }
      });
      upd("simStatus",    simOk ? "sim_done" : "error");
      upd("pipelineStep", null);
      if (!simOk) upd("simError", "Simulation failed — check console");
    } catch (err) {
      addLog(err.message, "error");
      upd("simStatus",    "error");
      upd("simError",     err.message);
      upd("pipelineStep", null);
    }
  }, [s, upd, addLog]);

  const handleAverager = useCallback(async () => {
    upd("simStatus", "averaging");
    upd("simError",  "");
    upd("averaged",  null);
    addLog("Running Averager…", "step");
    try {
      const res = await runAverager();
      if (res.success) {
        addLog(res.message, "success");
        if (res.averaged) upd("averaged", res.averaged);
        upd("simStatus", "averaged");
      } else {
        throw new Error(res.message || "Averager failed");
      }
    } catch (err) {
      addLog(err.message, "error");
      upd("simStatus", "error");
      upd("simError",  err.message);
    }
  }, [upd, addLog]);

  const handleAnalysis = useCallback(async () => {
    upd("simStatus",   "analysing");
    upd("simError",    "");
    upd("plotResults", null);
    upd("regression",  null);
    addLog("Running Analysis…", "step");
    try {
      const res = await runRegression();
      if (res.success) {
        addLog(res.message, "success");
        if (res.plot_results) upd("plotResults", res.plot_results);
        if (res.regression)   upd("regression",  res.regression);
        if (res.analysis)     upd("analysis",    res.analysis);
        if (res.plots_base)   upd("plotsDir",    res.plots_base);
        upd("simStatus", "analysed");
        setTimeout(() => setTab("DataAnalysis"), 600);
      } else {
        throw new Error(res.message || "Analysis failed");
      }
    } catch (err) {
      addLog(err.message, "error");
      upd("simStatus", "error");
      upd("simError",  err.message);
    }
  }, [upd, addLog, setTab]);

  const handleStop = useCallback(async () => {
    upd("simStatus",    "idle");
    upd("pipelineStep", null);
    addLog("Termination requested", "warning");
    try { await terminate(); } catch {}
  }, [upd, addLog]);

  return { handleRun, handleRunSimOnly, handleAverager, handleAnalysis, handleStop };
}
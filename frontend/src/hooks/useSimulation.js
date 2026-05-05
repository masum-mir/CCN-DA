// hooks/useSimulation.js
import { useCallback } from "react";
import { runPipeline, runAverager, runRegression } from "../api/simulator.js";
import { buildSettingsContent, calcBatch } from "./useConfig.js";
import { terminate } from "../api/simulator.js";

export function useSimulation(s, upd, addLog, setTab) {
  // Shared body builder
  const buildBody = useCallback(
    () => ({
      content: buildSettingsContent(s),
      settings_filename: (s.scenarioName || "TEST") + "_settings.txt",
      batch_count: calcBatch(s).total,
      compile: s.compileFirst,
      batchFolder: s.batchFolder || "reports/",
      analysisPlotsDir: s.analysisPlotsDir || "plots/",
      batchDelimiter: s.batchDelimiter || "_",
      batchExtension: s.batchExtension || ".txt",
      batchPrecision: s.batchPrecision || 4,
      analysisReportTypePos: s.analysisReportTypePos || 0,
      analysisRouterPos: s.analysisRouterPos || 1,
      analysisGroupingTypePos: s.analysisGroupingTypePos || -1,
    }),
    [s],
  );

  // Full pipeline
  const handleRun = useCallback(async () => {
    upd("simStatus", "running");
    upd("results", null);
    upd("plotResults", null);
    upd("simError", "");
    upd("averaged", null);
    upd("analysis", null);
    upd("regression", null);
    upd("pipelineStep", 1);
    addLog(
      "Starting full pipeline (Simulation → Parse → Average → Plots)",
      "step",
    );

    try {
      await runPipeline(buildBody(), (ev) => {
        if (ev.type === "step") {
          addLog("⚡ " + ev.message, "step");
          if (ev.step) upd("pipelineStep", ev.step);
        } else if (ev.type === "log") {
          addLog(ev.message, ev.level || "output");
        } else if (ev.type === "pipeline_complete") {
          if (ev.success) {
            addLog(ev.message, "success");
            upd("simStatus", "done");
            upd("pipelineStep", 5);
            if (ev.data) {
              if (ev.data.raw_results) upd("results", ev.data.raw_results);
              if (ev.data.plot_results)
                upd("plotResults", ev.data.plot_results);
              if (ev.data.averaged) upd("averaged", ev.data.averaged);
              if (ev.data.analysis) upd("analysis", ev.data.analysis);
              if (ev.data.regression) upd("regression", ev.data.regression);
              if (ev.data.saved_plots) upd("savedPlots", ev.data.saved_plots);
              if (ev.data.plots_base) upd("plotsDir", ev.data.plots_base);
              if (ev.data.grand_saved)
                addLog(
                  `${ev.data.grand_saved.length} plot(s) saved`,
                  "success",
                );
            }
            setTimeout(() => setTab("DataAnalysis"), 800);
          } else {
            addLog(ev.message, "error");
            upd("simStatus", "error");
            upd("simError", ev.message);
            upd("pipelineStep", null);
          }
        }
      });
    } catch (err) {
      addLog(err.message, "error");
      upd("simStatus", "error");
      upd("simError", err.message);
      upd("pipelineStep", null);
    }
  }, [s, upd, addLog, setTab, buildBody]);

  // Averager only ────
  const handleAverager = useCallback(async () => {
    upd("simStatus", "averaging");
    upd("simError", "");
    upd("averaged", null);
    addLog("Running Averager…", "step");

    try {
      const res = await runAverager(buildBody());
      if (res.success !== false) {
        addLog("Averager complete", "success");
        if (res.averaged) upd("averaged", res.averaged);
        upd("simStatus", "averaged");
      } else {
        throw new Error(res.message || "Averager failed");
      }
    } catch (err) {
      addLog(err.message, "error");
      upd("simStatus", "error");
      upd("simError", err.message);
    }
  }, [s, upd, addLog, buildBody]);

  // Analysis / Regression 
  const handleAnalysis = useCallback(async () => {
    upd("simStatus", "analysing");
    upd("simError", "");
    upd("plotResults", null);
    upd("regression", null);
    addLog("Running Analysis + Regression…", "step");

    try {
      const res = await runRegression(buildBody());
      if (res.success !== false) {
        addLog("Analysis complete", "success");
        if (res.plot_results) upd("plotResults", res.plot_results);
        if (res.regression) upd("regression", res.regression);
        if (res.analysis) upd("analysis", res.analysis);
        upd("simStatus", "analysed");
        setTimeout(() => setTab("DataAnalysis"), 600);
      } else {
        throw new Error(res.message || "Analysis failed");
      }
    } catch (err) {
      addLog(err.message, "error");
      upd("simStatus", "error");
      upd("simError", err.message);
    }
  }, [s, upd, addLog, setTab, buildBody]);

  // Stop
  const handleStop = useCallback(async () => {
    upd("simStatus", "idle");
    upd("pipelineStep", null);
    addLog("Termination requested", "warning");
    try {
      await terminate();
    } catch {
      /* ignore */
    }
  }, [upd, addLog]);

  return { handleRun, handleStop, handleAverager, handleAnalysis };
}

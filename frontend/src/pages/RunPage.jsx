import { Chk, ConsolePanel, PipelineSteps } from "../components/ui/UI.jsx";

export default function RunPage({
  s,
  upd,
  batch,
  handleRun,
  handleStop,
  handleAverager,
  handleAnalysis,
}) {
  const isRunning = s.simStatus === "running";
  const isAveraging = s.simStatus === "averaging";
  const isAnalysing = s.simStatus === "analysing";
  const isBusy = isRunning || isAveraging || isAnalysing;

  return (
    <div className="tabcontent">
      <div className="page-title">Run Simulation</div>

      {/* Batch Summary */}
      <div className="batch-preview-card">
        <div className="bpc-icon">
          <i className="fa-solid fa-border-all"></i>
        </div>
        <div>
          <div className="bpc-label">Total Batch Runs</div>
          <div className="bpc-num">{batch.total}</div>
          <div className="bpc-sub">
            {batch.routers} router{batch.routers !== 1 ? "s" : ""} ×{" "}
            {batch.seeds} seed{batch.seeds !== 1 ? "s" : ""} × {batch.ttls} TTL
            {batch.ttls !== 1 ? "s" : ""} × {batch.bufs} buffer
            {batch.bufs !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Pipeline progress */}
      {isRunning && s.pipelineStep && (
        <PipelineSteps currentStep={s.pipelineStep} />
      )}

      {/* Options */}
      <div style={{ marginBottom: 12 }}>
        <Chk
          id="compile"
          checked={s.compileFirst}
          onChange={(v) => upd("compileFirst", v)}
          label="Compile ONE before running"
        />
      </div>

      {/* Full pipeline button */}
      <button
        className="btn btn-run"
        style={{ width: "100%", marginBottom: 8 }}
        onClick={handleRun}
        disabled={isBusy}
      >
        {isRunning ? (
          <>
            <span className="spinner" /> Running pipeline…
          </>
        ) : (
          <>
            <i className="fa-solid fa-play"></i>{" "}
            Run ONE Simulator + Averager + Analysis + Regression
          </>
        )}
      </button>

      {/* Individual step buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={handleAverager}
          disabled={isBusy}
        >
          {isAveraging ? (
            <>
              <span className="spinner" /> Averaging…
            </>
          ) : (
            <>
              <i className="fa-solid fa-plus"></i> Run Averager
            </>
          )}
        </button>

        <button
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={handleAnalysis}
          disabled={isBusy}
        >
          {isAnalysing ? (
            <>
              <span className="spinner" /> Analysing…
            </>
          ) : (
            <>
              <i className="fa-solid fa-chart-bar"></i> Run Analysis
            </>
          )}
        </button>
      </div>

      {/* Stop button */}
      {isBusy && (
        <button
          className="btn btn-danger"
          style={{ width: "100%", marginBottom: 8 }}
          onClick={handleStop}
        >
        <i className="fa-solid fa-stop"></i> Stop
        </button>
      )}

      {s.simError && <div className="alert alert-danger">{s.simError}</div>}
      {s.simStatus === "done" && (
        <div className="alert alert-success">
          Pipeline complete — check Results tab
        </div>
      )}
      {s.simStatus === "averaged" && (
        <div className="alert alert-success"> Averager complete</div>
      )}
      {s.simStatus === "analysed" && (
        <div className="alert alert-success">
          Analysis complete — check Results tab
        </div>
      )}

      {/* Console */}
      <div style={{ marginTop: 20 }}>
        <ConsolePanel
          logs={s.consoleLogs}
          onClear={() => upd("consoleLogs", [])}
          onCopy={(t) => navigator.clipboard.writeText(t)}
        />
      </div>
    </div>
  );
}

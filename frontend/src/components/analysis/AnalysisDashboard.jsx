import { useState, useRef, useEffect } from "react";
import "../../styles/AnalysisDashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
 
// Plot card
function PlotCard({ path, name }) {
  const [expanded, setExpanded] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [status, setStatus] = useState("idle"); 
  const loadedRef = useRef(false);

  // Lazy-load: fetch only when the card first becomes visible
  const cardRef = useRef(null);
  useEffect(() => {
    if (!cardRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadedRef.current) {
          loadedRef.current = true;
          obs.disconnect();
          fetchImage();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, [path]);

  async function fetchImage() {
    setStatus("loading");
    try {
      const res = await fetch(
        `${API}/get-plot?path=${encodeURIComponent(path)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      setBlobUrl(URL.createObjectURL(blob));
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  // Cleanup blob URL on unmount
  useEffect(
    () => () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    },
    [blobUrl],
  );

  return (
    <>
      <div
        ref={cardRef}
        className="plot-card"
        onClick={() => status === "ok" && setExpanded(true)}
        title={status === "ok" ? "Click to enlarge" : undefined}
        style={{ cursor: status === "ok" ? "pointer" : "default" }}
      >
        <div className="plot-card-img-wrap">
          {status === "idle" && (
            <div className="plot-card-placeholder">
              <span style={{ fontSize: 24, opacity: 0.3 }}>🖼</span>
            </div>
          )}
          {status === "loading" && (
            <div className="plot-card-placeholder">
              <div className="plot-spinner" />
            </div>
          )}
          {status === "ok" && (
            <img src={blobUrl} alt={name} className="plot-card-img" />
          )}
          {status === "error" && (
            <div className="plot-card-fallback">
              <span style={{ fontSize: 22 }}>⚠</span>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--amber,#d97706)",
                  marginTop: 4,
                }}
              >
                Could not load image
              </span>
              <span className="plot-card-fallback-path">{path}</span>
              <button
                className="btn btn-ghost btn-xs"
                style={{ marginTop: 6, fontSize: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  loadedRef.current = false;
                  fetchImage();
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
        <div className="plot-card-name">{name}</div>
        <div className="plot-card-path">{path}</div>
      </div>

      {/* Lightbox */}
      {expanded && (
        <div className="plot-lightbox" onClick={() => setExpanded(false)}>
          <div
            className="plot-lightbox-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="plot-lightbox-close"
              onClick={() => setExpanded(false)}
            >
              ×
            </button>
            <div className="plot-lightbox-name">{name}</div>
            <img src={blobUrl} alt={name} className="plot-lightbox-img" />
            <div className="plot-lightbox-path">{path}</div>
          </div>
        </div>
      )}
    </>
  );
}

// Section of plots for one report type
function PlotSection({ reportType, info }) {
  const plots = info?.saved || [];
  // Derive a clean display name from each file path
  const namedPlots = plots.map((p) => {
    // e.g. "plots/CCN_router_delivery_ratio_vs_nrof_hosts.png"
    const filename = p.split("/").pop() || p;
    const stem = filename.replace(/\.(png|jpg|jpeg|svg|pdf)$/i, "");
    // Split on underscores, title-case, remove common prefixes
    const clean = stem
      .replace(/^CCN_/i, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { path: p, name: clean, filename };
  });

  if (namedPlots.length === 0) {
    return (
      <div className="plot-section">
        <div className="plot-section-header">
          <span className="plot-section-title">{reportType}</span>
          {info?.skipped && (
            <span className="plot-section-skipped">⚠ {info.skipped}</span>
          )}
        </div>
        <div className="dash-empty" style={{ padding: "12px 0" }}>
          No plots generated for this section.
        </div>
      </div>
    );
  }

  return (
    <div className="plot-section">
      <div className="plot-section-header">
        <span className="plot-section-title">{reportType}</span>
        <span className="plot-section-count">
          {namedPlots.length} plot{namedPlots.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="plot-grid-3">
        {namedPlots.map(({ path, name }) => (
          <PlotCard key={path} path={path} name={name} />
        ))}
      </div>

      {info?.skipped && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11.5,
            color: "var(--amber)",
            fontFamily: "var(--mono)",
          }}
        >
          ⚠ {info.skipped}
        </div>
      )}
    </div>
  );
}
 
// Main Dashboard
export default function AnalysisDashboard({ results, plotResults }) {
  const [view, setView] = useState("plots");  
  const [openFiles, setOpenFiles] = useState({});
 
  const fileEntries = results ? Object.entries(results) : [];
  const plotEntries = plotResults ? Object.entries(plotResults) : [];
  const totalPlots = plotEntries.reduce((s, [, v]) => s + (v?.total || 0), 0);

  const tabs = [
    { id: "plots", label: <><i className="fa-solid fa-image"></i> Plots ({totalPlots})</> }, 
    { id: "raw", label: <><i className="fa-solid fa-file-lines"></i> Raw Files</> },
  ];

  return (
    <div> 
 
      <div className="analysis-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`analysis-tab${view === t.id ? " active" : ""}`}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
 
      {view === "plots" &&
        (plotEntries.length === 0 ? (
          <div className="dash-empty">No plots were generated.</div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {plotEntries.map(([reportType, info]) => (
              <PlotSection
                key={reportType}
                reportType={reportType}
                info={info}
              />
            ))}
          </div>
        ))}
   
      {view === "raw" &&
        (fileEntries.length === 0 ? (
          <div className="dash-empty">No raw result files found.</div>
        ) : (
          <div>
            {fileEntries.map(([fname, fileData]) => (
              <div key={fname} className="results-file">
                <div
                  className="results-file-header"
                  onClick={() =>
                    setOpenFiles((p) => ({ ...p, [fname]: !p[fname] }))
                  }
                >
                  <span className="results-file-name"><i className="fa-solid fa-file-lines"></i> {fname}</span>
                  <span
                    style={{
                      color: "var(--ctx-3)",
                      fontSize: 11,
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {openFiles[fname] ? "▲" : "▼"}
                  </span>
                </div>
                {openFiles[fname] && (
                  <div className="results-file-body">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th style={{ textAlign: "right" }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(fileData?.parsed?.stats || {}).map(
                          ([k, v]) => (
                            <tr key={k}>
                              <td className="stat-key">
                                {k.replace(/_/g, " ")}
                              </td>
                              <td className="stat-val">{v}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                    {(fileData?.parsed?.raw_lines || []).length > 0 && (
                      <pre className="raw-lines">
                        {fileData.parsed.raw_lines.join("\n")}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

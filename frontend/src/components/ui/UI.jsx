// Chk, FG, FR, TagInput, ConsolePanel, PipelineSteps, ResultsPanel,
// QuickStartModal, PreviewModal
import { useState, useRef, useEffect } from "react";

export function Chk({ id, checked, onChange, label }) {
  return (
    <div className="checkbox-container">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function FG({ label, children, style }) {
  return (
    <div className="form-group" style={style}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export function FR({ children, style }) {
  return (
    <div className="form-row" style={style}>
      {children}
    </div>
  );
}

// Tag Input
export function TagInput({ values, options, onChange, placeholder }) {
  const [inp, setInp] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = options.filter(
    (o) => !values.includes(o) && o.toLowerCase().includes(inp.toLowerCase()),
  );
  const add = (v) => {
    if (!values.includes(v)) {
      onChange([...values, v]);
      setInp("");
      setOpen(false);
    }
  };
  const rem = (v) => onChange(values.filter((x) => x !== v));
  return (
    <div className="tag-input-wrapper">
      <div className="tag-input-box">
        {values.map((v) => (
          <span key={v} className="tag">
            {v}
            <button type="button" onClick={() => rem(v)}>
              ×
            </button>
          </span>
        ))}
        <input
          value={inp}
          placeholder={values.length ? "" : placeholder}
          onChange={(e) => {
            setInp(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inp.trim()) {
              add(inp.trim());
              e.preventDefault();
            }
            if (e.key === "Backspace" && !inp && values.length)
              rem(values[values.length - 1]);
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="tag-dropdown">
          {filtered.map((o) => (
            <div key={o} className="tag-option" onMouseDown={() => add(o)}>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Console Panel
export function ConsolePanel({ logs, onClear, onCopy }) {
  const bodyRef = useRef(null);
  const text = logs.map((l) => `[${l.ts}] ${l.msg}`).join("\n");

  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="console-panel">
      <div className="console-header">
        <div className="console-title">
          <i className="fa-solid fa-terminal"></i>
          Pipeline Log
        </div>
        <div className="console-actions">
          <button className="btn btn-ghost btn-xs" onClick={() => onCopy(text)}>
            Copy
          </button>
          <button className="btn btn-ghost btn-xs" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>
      <div className="console-body" ref={bodyRef}>
        {logs.length === 0 ? (
          <div className="log-line info">
            <span className="log-msg">No log yet.</span>
          </div>
        ) : (
          logs.map((l, i) => (
            <div key={`${l.ts}-${i}`} className={`log-line ${l.level}`}>
              <span className="log-ts">{l.ts}</span>
              <span className="log-msg">{l.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Pipeline Steps
export function PipelineSteps({ currentStep }) {
  const steps = [
    { id: 1, label: "Simulate", icon: "fa-play" },
    { id: 2, label: "Parse", icon: "fa-code" },
    { id: 3, label: "Average", icon: "fa-calculator" },
    { id: 4, label: "Plots", icon: "fa-chart-line" },
    { id: 5, label: "Done", icon: "fa-check" },
  ];
  return (
    <div className="pipeline-bar">
      {steps.map((st) => (
        <div
          key={st.id}
          className={`pipeline-step ${currentStep > st.id ? "done" : currentStep === st.id ? "active" : ""}`}
        >
          <span className="ps-icon">
            {currentStep > st.id ? (
              <i className="fa-solid fa-check"></i>
            ) : currentStep === st.id ? (
              <i className={`fa-solid ${st.icon} fa-spin`}></i>
            ) : (
              <i className={`fa-solid ${st.icon}`}></i>
            )}
          </span>
          <div className="ps-label">{st.label}</div>
        </div>
      ))}
    </div>
  );
}

// Results Panel
export function ResultsPanel({ results }) {
  const [open, setOpen] = useState({});
  return (
    <div>
      {Object.entries(results).map(([fname, data]) => (
        <div key={fname} className="results-file">
          <div
            className="results-file-header"
            onClick={() => setOpen((p) => ({ ...p, [fname]: !p[fname] }))}
          >
            <span className="results-file-name"><i className="fa-regular fa-file-lines" style={{ marginRight: 6 }}></i> {fname}</span>
            <span
              style={{
                color: "var(--tx-3)",
                fontSize: 11,
                
              }}
            >
              {open[fname] ? "▲" : "▼"}
            </span>
          </div>
          {open[fname] && (
            <div className="results-file-body open">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th style={{ textAlign: "right" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.parsed?.stats || {}).map(([k, v]) => (
                    <tr key={k}>
                      <td className="stat-key">{k}</td>
                      <td className="stat-val">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.parsed?.raw_lines?.length > 0 && (
                <pre
                  style={{
                    marginTop: 8,
                    fontSize: 10.5,
                    
                    color: "var(--tx-3)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {data.parsed.raw_lines.join("\n")}
                </pre>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

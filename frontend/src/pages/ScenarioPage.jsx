import { Chk, FG, FR } from "../components/ui/UI.jsx";
// import { testCity } from "../api/simulator.js";

export default function ScenarioPage({ s, upd, onImport }) {
  return (
    <div className="tabcontent">
      <div className="page-title">01 · Scenario Settings</div>
 
      <div className="import-banner">
        <span className="import-label"><i className="fa-solid fa-folder-open"></i> Import Config</span>
        <input
          type="file"
          accept=".txt"
          onChange={onImport}
          className="file-input-inline"
        />
        {s.importStatus && (
          <span
            className={`import-status ${s.importStatus.ok === true ? "ok" : s.importStatus.ok === false ? "err" : ""}`}
          >
            {s.importStatus.msg}
          </span>
        )}
      </div>

      <FR>
        <FG label="Scenario Name">
          <input
            type="text"
            value={s.scenarioName}
            onChange={(e) => upd("scenarioName", e.target.value)}
          />
        </FG>
        <FG label="Update Interval (s)">
          <input
            type="number"
            value={s.updateInterval}
            step="0.1"
            min="0"
            onChange={(e) => upd("updateInterval", e.target.value)}
          />
        </FG>
        <FG label="End Time (s)">
          <input
            type="number"
            value={s.endTime}
            min="0"
            onChange={(e) => upd("endTime", e.target.value)}
          />
        </FG>
      </FR>
      <FR>
        <Chk
          id="nameAdd"
          checked={s.nameAddDateTime}
          onChange={(v) => upd("nameAddDateTime", v)}
          label="Include Date/Time in name"
        />
        <Chk
          id="simConn"
          checked={s.simulateConnections}
          onChange={(v) => upd("simulateConnections", v)}
          label="Simulate Connections"
        />
      </FR>

      {/* WKT Generator */}
      {/* <div style={{ marginTop: 28 }}>
        <div className="page-title" style={{ marginBottom: 16 }}>
          WKT Map Generator
        </div>
        <FG label="City / Location">
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={s.wktLocation}
              placeholder="e.g. Dhaka, Bangladesh"
              onChange={(e) => {
                upd("wktLocation", e.target.value);
                upd(
                  "wktOutputName",
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "_")
                    .replace(/_+/g, "_"),
                );
              }}
            />
            <button
              className="btn btn-secondary btn-sm"
              style={{ flexShrink: 0 }}
              onClick={async () => {
                if (!s.wktLocation.trim()) {
                  upd("wktStatus", {
                    ok: false,
                    msg: "Enter a location first",
                  });
                  return;
                }
                upd("wktStatus", { ok: null, msg: "Testing…" });
                try {
                  const d = await testCity(s.wktLocation);
                  upd("wktStatus", { ok: d.available, msg: d.message });
                } catch {
                  upd("wktStatus", {
                    ok: false,
                    msg: "Error testing location",
                  });
                }
              }}
            >
              Test
            </button>
          </div>
          {s.wktStatus && (
            <div
              className={`alert ${s.wktStatus.ok === true ? "alert-success" : s.wktStatus.ok === false ? "alert-danger" : "alert-warning"}`}
            >
              {s.wktStatus.msg}
            </div>
          )}
        </FG>
        <FR>
          <FG label="Map Size (m)">
            <input
              type="number"
              value={s.wktMapSize}
              min="500"
              max="50000"
              onChange={(e) => upd("wktMapSize", e.target.value)}
            />
          </FG>
          <FG label="Detail Level">
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 8,
                alignItems: "center",
              }}
            >
              {["detailed", "simplified"].map((opt) => (
                <label
                  key={opt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    fontFamily: "var(--sans)",
                    fontSize: 12.5,
                  }}
                >
                  <input
                    type="radio"
                    name="det"
                    value={opt}
                    checked={s.wktDetail === opt}
                    onChange={() => upd("wktDetail", opt)}
                  />
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </label>
              ))}
            </div>
          </FG>
        </FR>
        <FG label="Output Filename">
          <input
            type="text"
            value={s.wktOutputName}
            placeholder="e.g. dhaka_map"
            onChange={(e) => upd("wktOutputName", e.target.value)}
          />
        </FG>
        <button
          className="btn btn-primary"
          style={{ marginTop: 10 }}
          onClick={() =>
            alert("WKT generation requires the /generate backend endpoint.")
          }
        >
          Generate WKT Map
        </button>
      </div> */}
    </div>
  );
}

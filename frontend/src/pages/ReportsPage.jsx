import { FG, FR } from "../components/ui/UI.jsx";

const REPORT_CLASSES = [
  "CCNApplicationReporter",
  "MessageStatsReport",
  "BufferOccupancyReport",
  "ConnectivityONEReport",
  "ContactTimesReport",
  "DeliveredMessagesReport",
  "EnergyLevelReport",
  "EventLogReport",
  "MessageDelayReport",
  "NodeDensityReport",
  "UniqueEncountersReport",
];

export default function ReportsPage({ s, upd }) {
  return (
    <div className="tabcontent">
      <div className="page-title">05 · Report Settings</div>

      <fieldset>
        <legend>Add Report</legend>
        <FR>
          <FG label="Report Class">
            <select
              value={s.reportClass}
              onChange={(e) => upd("reportClass", e.target.value)}
            >
              {REPORT_CLASSES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </FG>
          <FG label="Report Warmup (s)">
            <input
              type="number"
              value={s.reportWarmup}
              onChange={(e) => upd("reportWarmup", e.target.value)}
            />
          </FG>
          <FG label="Report Directory">
            <input
              type="text"
              value={s.reportDir}
              onChange={(e) => upd("reportDir", e.target.value)}
            />
          </FG>
        </FR>
        <button
          className="btn btn-primary btn-sm"
          style={{ marginTop: 6 }}
          onClick={() => {
            if (s.reports.includes(s.reportClass)) {
              alert("Already added");
              return;
            }
            upd("reports", [...s.reports, s.reportClass]);
          }}
        >
          + Add Report
        </button>
      </fieldset>

      <h3>Active Reports</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Report Class</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {s.reports.map((r, i) => (
            <tr key={i}>
              <td style={{ color: "var(--tx-3)", fontFamily: "var(--mono)" }}>
                {i + 1}
              </td>
              <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{r}</td>
              <td>
                <button
                  className="btn btn-danger btn-xs"
                  onClick={() =>
                    upd(
                      "reports",
                      s.reports.filter((_, j) => j !== i),
                    )
                  }
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { FG, FR } from "../components/ui/UI.jsx";

export default function PostProcessPage({ s, upd }) {
  return (
    <div className="tabcontent">
      <div className="page-title">07 · Post-Processing Configuration</div>

      <fieldset>
        <legend>Directories</legend>
        <FR>
          <FG label="Report Folder">
            <input
              type="text"
              value={s.batchFolder}
              onChange={(e) => upd("batchFolder", e.target.value)}
            />
          </FG>
          <FG label="Output Plots Dir">
            <input
              type="text"
              value={s.analysisPlotsDir}
              onChange={(e) => upd("analysisPlotsDir", e.target.value)}
            />
          </FG>
        </FR>
      </fieldset>

      <fieldset>
        <legend>File Settings</legend>
        <FR>
          <FG label="File Extension">
            <input
              type="text"
              value={s.batchExtension}
              onChange={(e) => upd("batchExtension", e.target.value)}
            />
          </FG>
          <FG label="Filename Delimiter">
            <input
              type="text"
              value={s.batchDelimiter}
              onChange={(e) => upd("batchDelimiter", e.target.value)}
            />
          </FG>
          <FG label="Data Separator">
            <input
              type="text"
              value={s.batchDataSeparator}
              onChange={(e) => upd("batchDataSeparator", e.target.value)}
            />
          </FG>
          <FG label="Output Precision">
            <input
              type="number"
              value={s.batchPrecision}
              onChange={(e) => upd("batchPrecision", e.target.value)}
            />
          </FG>
        </FR>
      </fieldset>

      <fieldset>
        <legend>Averager — Batch Component Positions</legend>
        <table className="data-table">
          <thead>
            <tr>
              <th>Component Name</th>
              <th>Position (0-based)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {s.batchComponents.map((c, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => {
                      const a = [...s.batchComponents];
                      a[i] = { ...a[i], name: e.target.value };
                      upd("batchComponents", a);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={c.position}
                    style={{ width: 70 }}
                    onChange={(e) => {
                      const a = [...s.batchComponents];
                      a[i] = { ...a[i], position: e.target.value };
                      upd("batchComponents", a);
                    }}
                  />
                </td>
                <td>
                  <button
                    className="btn btn-danger btn-xs"
                    onClick={() =>
                      upd(
                        "batchComponents",
                        s.batchComponents.filter((_, j) => j !== i),
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
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 8 }}
          onClick={() =>
            upd("batchComponents", [
              ...s.batchComponents,
              { name: "", position: s.batchComponents.length },
            ])
          }
        >
          + Add Component
        </button>
      </fieldset>

      <fieldset>
        <legend>Analysis Position Settings</legend>
        <FR>
          <FG label="Report Type Position">
            <input
              type="number"
              value={s.analysisReportTypePos}
              onChange={(e) => upd("analysisReportTypePos", e.target.value)}
            />
          </FG>
          <FG label="Router Position">
            <input
              type="number"
              value={s.analysisRouterPos}
              onChange={(e) => upd("analysisRouterPos", e.target.value)}
            />
          </FG>
          <FG label="Grouping Type Position">
            <input
              type="number"
              value={s.analysisGroupingTypePos}
              onChange={(e) => upd("analysisGroupingTypePos", e.target.value)}
            />
          </FG>
        </FR>
      </fieldset>
    </div>
  );
}

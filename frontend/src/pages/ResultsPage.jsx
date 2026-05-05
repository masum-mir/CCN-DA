import AnalysisDashboard from "../components/analysis/AnalysisDashboard.jsx";

export default function ResultsPage({ s, setTab }) {
  const hasData = s.results || s.plotResults || s.averaged;

  if (!hasData) {
    return (
      <div className="tabcontent">
        <div className="page-title">Results &amp; Data Analysis</div>
        <div className="alert alert-warning" style={{ marginTop: 24 }}>
          No results yet — run the simulation pipeline first.{" "}
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 8 }}
            onClick={() => setTab("RunSimulation")}
          >
            Go to Run →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tabcontent">
      <div className="page-title">Results &amp; Data Analysis</div>
      <AnalysisDashboard results={s.results} plotResults={s.plotResults} />
    </div>
  );
}

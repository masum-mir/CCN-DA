const TABS = [
  {
    id: "ScenarioSettings",
    label: "Scenario",
    icon: "fa-solid fa-gear",
    num: "01",
  },
  {
    id: "InterfaceSettings",
    label: "Interfaces",
    icon: "fa-solid fa-satellite-dish",
    num: "02",
  },
  { id: "CCNSettings", label: "CCN Apps", icon: "fa-solid fa-link", num: "03" },
  {
    id: "GroupSettings",
    label: "Groups",
    icon: "fa-solid fa-users",
    num: "04",
  },
  {
    id: "ReportSettings",
    label: "Reports",
    icon: "fa-solid fa-file-lines",
    num: "05",
  },
  {
    id: "OverlayMovement",
    label: "Movement & GUI",
    icon: "fa-solid fa-map",
    num: "06",
  },
  // {
  //   id: "PostProcessing",
  //   label: "Post-Processing",
  //   icon: "fa-solid fa-flask",
  //   num: "07",
  // },
];

export { TABS };

export default function Sidebar({ tab, setTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-wordmark">ONE Simulator</div>
        <div className="brand-title">CCN-DA</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Configuration</div>

        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-num">{t.num}</span>
            <span className="nav-icon">
              <i className={t.icon}></i>
            </span>
            {t.label}
          </button>
        ))}

        <div className="nav-divider" />

        <button
          className={`nav-btn nav-run ${tab === "RunSimulation" ? "active" : ""}`}
          onClick={() => setTab("RunSimulation")}
        >
          <span className="nav-num"> </span>
          <i className="fa-solid fa-play"></i>
          Run Simulation
        </button>

        <button
          className={`nav-btn nav-results ${tab === "DataAnalysis" ? "active" : ""}`}
          onClick={() => setTab("DataAnalysis")}
        >
          <span className="nav-num"> </span>
          <i className="fa-solid fa-chart-bar"></i>
          Results
        </button>
      </nav>
    </aside>
  );
}

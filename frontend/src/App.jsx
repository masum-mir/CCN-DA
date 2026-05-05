// App.jsx  —  Shell layout, global state, tab routing
import { useState, useCallback } from "react";
import "./styles/App.css";
import "./styles/Sidebar.css";
import "./styles/Header.css";
import "./styles/Footer.css";
import "./styles/ScenarioPage.css";
import "./styles/UI.css";
import "./styles/RunPage.css";
import "./styles/MovementPage.css";

// Layout
import Sidebar, { TABS } from "./components/layout/Sidebar.jsx";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";

// Pages
import ScenarioPage from "./pages/ScenarioPage.jsx";
import InterfacePage from "./pages/InterfacePage.jsx";
import CCNPage from "./pages/CCNPage.jsx";
import GroupsPage from "./pages/GroupsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import MovementPage from "./pages/MovementPage.jsx";
import PostProcessPage from "./pages/PostProcessPage.jsx";
import RunPage from "./pages/RunPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";

// State & hooks
import { initState } from "./state/initialState.js";
import { useLogger } from "./hooks/useLogger.js";
import { useConfig, calcBatch } from "./hooks/useConfig.js";
import { useSimulation } from "./hooks/useSimulation.js";

export default function App() {
  const [s, setS] = useState(initState);
  const [tab, setTab] = useState("ScenarioSettings");

  // Core updaters
  const upd = useCallback((k, v) => setS((p) => ({ ...p, [k]: v })), []);
  const updn = useCallback(
    (k, f, v) => setS((p) => ({ ...p, [k]: { ...p[k], [f]: v } })),
    [],
  );

  // Hooks
  const { addLog } = useLogger(setS);
  const { handleImport } = useConfig(s, upd, setS);
  console.log("handleImport:: ", s);

  const { handleRun, handleStop, handleAverager, handleAnalysis } =
    useSimulation(s, upd, addLog, setTab);
  // console.log(
  //   "Handle info:: ",
  //   handleRun,
  //   handleStop,
  //   handleAverager,
  //   handleAnalysis,
  // );

  const batch = calcBatch(s);

  const currentTabLabel =
    TABS.find((t) => t.id === tab)?.label ||
    (tab === "RunSimulation" ? "Run Simulation" : "Results");

  const pageProps = { s, upd, updn, addLog };

  return (
    <div className="app-shell">
      <Sidebar tab={tab} setTab={setTab} />

      <Header
        tabLabel={currentTabLabel}
        batch={batch}
        onReset={() => {
          setS(initState());
          setTab("ScenarioSettings");
        }}
      />

      <main className="main-content">
        <div className="container">
          {tab === "ScenarioSettings" && (
            <ScenarioPage {...pageProps} onImport={handleImport} />
          )}
          {tab === "InterfaceSettings" && <InterfacePage {...pageProps} />}
          {tab === "CCNSettings" && <CCNPage {...pageProps} />}
          {tab === "GroupSettings" && <GroupsPage {...pageProps} />}
          {tab === "ReportSettings" && <ReportsPage s={s} upd={upd} />}
          {tab === "OverlayMovement" && <MovementPage s={s} upd={upd} />}
          {tab === "PostProcessing" && <PostProcessPage s={s} upd={upd} />}
          {tab === "RunSimulation" && (
            <RunPage
              s={s}
              upd={upd}
              batch={batch}
              handleRun={handleRun}
              handleStop={handleStop}
              handleAverager={handleAverager}
              handleAnalysis={handleAnalysis}
            />
          )}
          {tab === "DataAnalysis" && <ResultsPage s={s} setTab={setTab} />}
        </div>
      </main>

      <Footer simStatus={s.simStatus} />
    </div>
  );
}

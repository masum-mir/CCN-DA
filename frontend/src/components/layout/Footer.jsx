export default function Footer({ simStatus }) {
  return (
    <footer className="app-footer">
      <div className="footer-status">
        <div className={`status-dot ${simStatus}`} />
        <span>
          {simStatus === "idle" && "Ready"}
          {simStatus === "running" && "Simulation running…"}
          {simStatus === "done" && "Pipeline complete"}
          {simStatus === "error" && "Error — check console"}
        </span>
      </div>
      <div className="footer-right">
        <span className="footer-link">ONE Simulator</span>
      </div>
    </footer>
  );
}

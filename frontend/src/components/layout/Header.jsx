export default function Header({ tabLabel, batch, onReset }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-breadcrumb">
          ccn-da <span>/</span> <strong>{tabLabel}</strong>
        </div>
        <div className="batch-pill">
          <div className="batch-dot" />
          <span className="batch-text">{batch.total}</span>
          <span className="batch-sub">
            runs · {batch.routers}R × {batch.seeds}S × {batch.ttls}T ×{" "}
            {batch.bufs}B
          </span>
        </div>
      </div>

      <div className="header-actions"> 
        <button className="btn btn-secondary btn-sm" onClick={onReset}>
          <i className="fa-solid fa-rotate-left"></i> Reset
        </button>
      </div>
    </header>
  );
}

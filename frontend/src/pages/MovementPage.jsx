import { FG, FR } from "../components/ui/UI.jsx";

export default function MovementPage({ s, upd }) {
  return (
    <div className="tabcontent">
      <div className="page-title">06 · Movement Model</div>

      <FR>
        <FG label="RNG Seed (use ; for batch e.g. 13; 27)">
          <input
            value={s.rngSeed}
            type="text"
            onChange={(e) => upd("rngSeed", e.target.value)}
          />
        </FG>
        <FG label="Warmup Time (s)">
          <input
            type="number"
            value={s.warmup}
            onChange={(e) => upd("warmup", e.target.value)}
          />
        </FG>
      </FR>
      <FG label="World Size (width, height in meters)">
        <input
          value={s.worldSize}
          type="text"
          onChange={(e) => upd("worldSize", e.target.value)}
        />
      </FG>

      <FG label="Map Files (.wkt)" style={{ marginTop: 14 }}>
        <input
          type="file"
          accept=".wkt"
          multiple
          onChange={(e) => {
            const names = Array.from(e.target.files).map((f) => f.name);
            const existing = new Set(s.mapFiles);
            const toAdd = names.filter((n) => !existing.has(n));
            if (toAdd.length) upd("mapFiles", [...s.mapFiles, ...toAdd]);
            e.target.value = "";
          }}
        />
      </FG>
      <h4>Selected Map Files</h4>
      <ul className="file-list">
        {s.mapFiles.map((f, i) => (
          <li key={i}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{f}</span>
            <button
              className="btn btn-danger btn-xs"
              onClick={() =>
                upd(
                  "mapFiles",
                  s.mapFiles.filter((_, j) => j !== i),
                )
              }
            >
            <i className="fa-solid fa-trash"></i>
            </button>
          </li>
        ))}
      </ul>

      <div className="page-title" style={{ marginTop: 28 }}>
        GUI Settings
      </div>

      <FG label="Overlay Image File">
        <div
          style={{
            fontSize: 11,
            color: "var(--tx-3)",
            marginBottom: 6,
            fontFamily: "var(--mono)",
          }}
        >
          Default: data/helsinki_underlay.png
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files[0]) upd("guiImageFile", e.target.files[0].name);
          }}
        />
        {s.guiImageFile !== "helsinki_underlay.png" && (
          <span
            style={{
              fontSize: 11,
              color: "var(--green)",
              marginTop: 4,
              display: "block",
              fontFamily: "var(--mono)",
            }}
          >
            Selected: {s.guiImageFile}
          </span>
        )}
      </FG>
      <FR style={{ marginTop: 10 }}>
        <FG label="Image Offset (x, y)">
          <input
            type="text"
            value={s.guiImageOffset}
            onChange={(e) => upd("guiImageOffset", e.target.value)}
          />
        </FG>
        <FG label="Image Scale">
          <input
            type="number"
            step="0.01"
            value={s.guiImageScale}
            onChange={(e) => upd("guiImageScale", e.target.value)}
          />
        </FG>
      </FR>
      <FR>
        <FG label="Image Rotate (radians)">
          <input
            type="number"
            step="0.001"
            value={s.guiImageRotate}
            onChange={(e) => upd("guiImageRotate", e.target.value)}
          />
        </FG>
        <FG label="Log Panel Events">
          <input
            type="number"
            value={s.guiEventLogEvents}
            onChange={(e) => upd("guiEventLogEvents", e.target.value)}
          />
        </FG>
      </FR>
    </div>
  );
}

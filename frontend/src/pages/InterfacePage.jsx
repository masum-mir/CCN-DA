import { FG, FR } from "../components/ui/UI.jsx";

export default function InterfacePage({ s, upd, updn }) {
  const addIface = () => {
    const iface = s.newIface;
    if (!iface.name.trim()) return;
    upd("interfaces", [...s.interfaces, { ...iface }]);
    upd("newIface", {
      name: "",
      type: "SimpleBroadcastInterface",
      transmitSpeed: "",
      transmitRange: "",
    });
  };

  return (
    <div className="tabcontent">
      <div className="page-title">02 · Interface Settings</div>
 
      <fieldset>
        <legend>Add Interface</legend>
        <FR>
          <FG label="Name">
            <input
              type="text"
              value={s.newIface.name}
              onChange={(e) => updn("newIface", "name", e.target.value)}
              placeholder="e.g. btInterface"
            />
          </FG>
          <FG label="Type">
            <select
              value={s.newIface.type}
              onChange={(e) => updn("newIface", "type", e.target.value)}
            >
              {["SimpleBroadcastInterface", "DirectDeliveryInterface"].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </select>
          </FG>
        </FR>
        <FR>
          <FG label="Transmit Speed">
            <input
              type="text"
              value={s.newIface.transmitSpeed}
              onChange={(e) =>
                updn("newIface", "transmitSpeed", e.target.value)
              }
              placeholder="e.g. 250k"
            />
          </FG>
          <FG label="Transmit Range (m)">
            <input
              type="text"
              value={s.newIface.transmitRange}
              onChange={(e) =>
                updn("newIface", "transmitRange", e.target.value)
              }
              placeholder="e.g. 10"
            />
          </FG>
        </FR>
        <button
          className="btn btn-primary btn-sm"
          style={{ marginTop: 6 }}
          onClick={addIface}
        >
          + Add Interface
        </button>
      </fieldset>

      {/* Active interfaces */}
      <h3>Active Interfaces</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Type</th>
            <th>Speed</th>
            <th>Range (m)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {s.interfaces.map((iface, i) => (
            <tr key={i}>
              <td style={{ color: "var(--tx-3)", fontFamily: "var(--mono)" }}>
                {i + 1}
              </td>
              <td style={{ fontFamily: "var(--mono)" }}>{iface.name}</td>
              <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                {iface.type}
              </td>
              <td style={{ fontFamily: "var(--mono)" }}>
                {iface.transmitSpeed}
              </td>
              <td style={{ fontFamily: "var(--mono)" }}>
                {iface.transmitRange}
              </td>
              <td>
                <button
                  className="btn btn-danger btn-xs"
                  onClick={() =>
                    upd(
                      "interfaces",
                      s.interfaces.filter((_, j) => j !== i),
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

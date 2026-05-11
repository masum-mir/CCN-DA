import { FG, FR, TagInput } from "../components/ui/UI.jsx";

const MOVEMENT_MODELS = [
  "ShortestPathMapBasedMovement",
  "StationaryMovement",
  "MapRouteMovement",
  "RandomWaypoint",
  "BusMovement",
  "LinearMovement",
];

const ROUTER_OPTIONS = [
  "CCNRouter",
  "EpidemicRouter",
  "SprayAndWaitRouter",
  "ProphetRouter",
  "DirectDeliveryRouter",
  "FirstContactRouter",
];

const APPLICATION_TYPES = ["Source", "Sink", "Seeder"];

const INTERFACE_OPTIONS = ["btInterface", "highspeedInterface"];

// Per-application type defaults
const APP_DEFAULTS = {
  Source: {
    movementModel: "StationaryMovement",
    interface1: "highspeedInterface",
    bufferSize: "1G",
    speed: "0,0",
    nodeLocation: "",
  },
  Sink: {
    movementModel: "ShortestPathMapBasedMovement",
    interface1: "btInterface",
    bufferSize: "",
    speed: "",
    nodeLocation: "",
  },
  Seeder: {
    movementModel: "ShortestPathMapBasedMovement",
    interface1: "btInterface",
    bufferSize: "50M",
    speed: "0.5, 1.5",
    nodeLocation: "",
  },
};

export default function GroupsPage({ s, upd, updn }) {
  console.log("group data: ", s);
  const ng = s.newGroup;
  const appType = ng.applicationType || "Source";

  // When application type changes, apply sensible defaults
  const handleAppTypeChange = (val) => {
    const defaults = APP_DEFAULTS[val] || {};
    upd("newGroup", {
      ...ng,
      applicationType: val,
      movementModel: defaults.movementModel ?? ng.movementModel,
      interface1: defaults.interface1 ?? ng.interface1,
      bufferSize: defaults.bufferSize ?? ng.bufferSize,
      speed: defaults.speed ?? ng.speed,
      nodeLocation: defaults.nodeLocation ?? ng.nodeLocation,
    });
  };

  const addGroup = () => {
    if (!ng.groupID.trim()) return;
    upd("groups", [
      ...s.groups,
      {
        groupID: ng.groupID,
        numHosts: ng.numHosts,
        movementModel: ng.movementModel,
        routeFile: ng.routeFile,
        routeType: ng.routeType,
        router: ng.router,
        activeTimes: ng.activeTimes,
        msgTtl: ng.msgTtl,
        applicationType: appType,
        interface1: ng.interface1 || "btInterface",
        bufferSize: ng.bufferSize || "",
        speed: ng.speed || "",
        nodeLocation: ng.nodeLocation || "",
        waitTime: ng.waitTime || "",
        okMaps: ng.okMaps || "",
      },
    ]);
  };

  const isSource = appType === "Source";
  const isSeeder = appType === "Seeder";
  const isMapRoute = ng.movementModel === "MapRouteMovement";
  const isStationary = ng.movementModel === "StationaryMovement";

  return (
    <div className="tabcontent">
      <div className="page-title">04 · Group Settings</div>

      {/* Common group defaults */}
      <fieldset>
        <legend>Common Group Defaults</legend>
        <FR>
          <FG label="Movement Model">
            <select
              value={s.commonGroup.movementModel}
              onChange={(e) =>
                updn("commonGroup", "movementModel", e.target.value)
              }
            >
              {MOVEMENT_MODELS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </FG>
          <FG label="Buffer Size (use ; for batch, e.g. 4M; 8M)">
            <input
              type="text"
              value={s.commonGroup.bufferSize}
              onChange={(e) =>
                updn("commonGroup", "bufferSize", e.target.value)
              }
            />
          </FG>
        </FR>
        <FR>
          <FG label="Wait Time (min, max)">
            <input
              type="text"
              value={s.commonGroup.waitTime}
              onChange={(e) => updn("commonGroup", "waitTime", e.target.value)}
            />
          </FG>
          <FG label="Speed (min, max)">
            <input
              type="text"
              value={s.commonGroup.speed}
              onChange={(e) => updn("commonGroup", "speed", e.target.value)}
            />
          </FG>
          <FG label="Nrof Hosts">
            <input
              type="number"
              value={s.commonGroup.nrofHosts}
              onChange={(e) => updn("commonGroup", "nrofHosts", e.target.value)}
            />
          </FG>
        </FR>
        <FR>
          <FG label="Message TTL (use ; for batch, e.g. 50; 100; 150)">
            <input
              type="text"
              value={s.commonGroup.ttl}
              onChange={(e) => updn("commonGroup", "ttl", e.target.value)}
            />
          </FG>
          <FG label="Interface">
            <select
              value={s.commonGroup.interface}
              onChange={(e) => updn("commonGroup", "interface", e.target.value)}
            >
              {s.interfaces.map((i) => (
                <option key={i.name}>{i.name}</option>
              ))}
            </select>
          </FG>
        </FR>
        <FG label="Routers (select one or more for batch)">
          <TagInput
            values={s.commonGroup.routers}
            options={ROUTER_OPTIONS}
            onChange={(v) => updn("commonGroup", "routers", v)}
            placeholder="Add router…"
          />
        </FG>
      </fieldset>

      {/* Add a new group */}
      <fieldset>
        <legend>Add Group</legend>

        <FR>
          <FG label="Application Type">
            <select
              value={appType}
              onChange={(e) => handleAppTypeChange(e.target.value)}
            >
              {APPLICATION_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FG>
          <FG label="Group ID">
            <input
              type="text"
              value={ng.groupID}
              onChange={(e) => updn("newGroup", "groupID", e.target.value)}
              placeholder={
                isSource
                  ? "e.g. S"
                  : appType === "Sink"
                    ? "e.g. p"
                    : "e.g. c"
              }
            />
          </FG>
          <FG label="No. of Hosts">
            <input
              type="number"
              value={ng.numHosts}
              onChange={(e) => updn("newGroup", "numHosts", e.target.value)}
            />
          </FG>
          <FG label="Message TTL">
            <input
              type="text"
              value={ng.msgTtl}
              onChange={(e) => updn("newGroup", "msgTtl", e.target.value)}
            />
          </FG>
        </FR>

        <FR>
          <FG label="Movement Model">
            <select
              value={ng.movementModel}
              onChange={(e) =>
                updn("newGroup", "movementModel", e.target.value)
              }
            >
              {MOVEMENT_MODELS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </FG>

          {isMapRoute && (
            <>
              <FG label="Route File">
                <input
                  type="text"
                  value={ng.routeFile}
                  onChange={(e) =>
                    updn("newGroup", "routeFile", e.target.value)
                  }
                  placeholder="e.g. data/tram3.wkt"
                />
              </FG>
              <FG label="Route Type">
                <input
                  type="number"
                  value={ng.routeType}
                  min="0"
                  max="2"
                  onChange={(e) =>
                    updn("newGroup", "routeType", e.target.value)
                  }
                />
              </FG>
            </>
          )}

          {/* Node location – Source (Stationary) */}
          {isSource && isStationary && (
            <FG label="Node Location (x, y)">
              <input
                type="text"
                value={ng.nodeLocation}
                onChange={(e) =>
                  updn("newGroup", "nodeLocation", e.target.value)
                }
                placeholder="e.g. 2600,2200"
              />
            </FG>
          )}
        </FR>
 
        <FR>
          <FG label="Interface">
            <select
              value={ng.interface1 || "btInterface"}
              onChange={(e) => updn("newGroup", "interface1", e.target.value)}
            >
              {[
                ...INTERFACE_OPTIONS,
                ...s.interfaces
                  .map((i) => i.name)
                  .filter((n) => !INTERFACE_OPTIONS.includes(n)),
              ].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </FG>

          {/* Buffer size – Source always 1G, Sink hidden, Seeder 50M */}
          {(isSource || isSeeder) && (
            <FG label="Buffer Size">
              <input
                type="text"
                value={ng.bufferSize}
                onChange={(e) => updn("newGroup", "bufferSize", e.target.value)}
                placeholder={isSource ? "1G" : "50M"}
              />
            </FG>
          )}

          {/* Speed – hidden for Stationary Source */}
          {!(isSource && isStationary) && (
            <FG label="Speed (min, max)">
              <input
                type="text"
                value={ng.speed}
                onChange={(e) => updn("newGroup", "speed", e.target.value)}
                placeholder="e.g. 2.7, 13.9"
              />
            </FG>
          )}

          {/* Wait time – Seeder only */}
          {isSeeder && (
            <FG label="Wait Time (min, max)">
              <input
                type="text"
                value={ng.waitTime || ""}
                onChange={(e) => updn("newGroup", "waitTime", e.target.value)}
                placeholder="e.g. 10, 30"
              />
            </FG>
          )}

          {/* okMaps – Seeder bus/car groups */}
          {isSeeder && (
            <FG label="okMaps (optional)">
              <input
                type="text"
                value={ng.okMaps || ""}
                onChange={(e) => updn("newGroup", "okMaps", e.target.value)}
                placeholder="e.g. 1"
              />
            </FG>
          )}
        </FR>

        <button
          className="btn btn-primary btn-sm"
          style={{ marginTop: 6 }}
          onClick={addGroup}
        >
          + Add Group
        </button>
      </fieldset>

      {/* Group list */}
      <h3>Groups ({s.groups.length})</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>App</th>
            <th>ID</th>
            <th>Hosts</th>
            <th>Movement</th>
            <th>Interface</th>
            <th>Buffer</th>
            <th>TTL</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {s.groups.map((g, i) => {
            // Badge colour per app type
            const badgeColor =
              g.applicationType === "Source"
                ? "var(--accent-green, #22c55e)"
                : g.applicationType === "Sink"
                  ? "var(--accent-blue,  #3b82f6)"
                  : g.applicationType === "Seeder"
                    ? "var(--accent-amber, #f59e0b)"
                    : "var(--tx-3)";

            return (
              <tr key={i}>
                <td style={{ color: "var(--tx-3)", fontFamily: "var(--mono)" }}>
                  {i + 1}
                </td>
                <td>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: badgeColor + "22",
                      color: badgeColor,
                    }}
                  >
                    {g.applicationType || "—"}
                  </span>
                </td>
                <td style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>
                  {g.groupID}
                </td>
                <td style={{ fontFamily: "var(--mono)" }}>{g.numHosts}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                  {g.movementModel}
                </td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                  {g.interface1 || "—"}
                </td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                  {g.bufferSize || "—"}
                </td>
                <td style={{ fontFamily: "var(--mono)" }}>{g.msgTtl}</td>
                <td>
                  <button
                    className="btn btn-danger btn-xs"
                    onClick={() =>
                      upd(
                        "groups",
                        s.groups.filter((_, j) => j !== i),
                      )
                    }
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

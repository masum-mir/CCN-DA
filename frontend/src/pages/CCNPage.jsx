import { Chk, FG, FR } from "../components/ui/UI.jsx";

export default function CCNPage({ s, upd, updn }) {
  return (
    <div className="tabcontent">
      <div className="page-title">03 · CCN Application Settings</div>

      <fieldset>
        <legend>Source</legend>
        <FR>
          <FG label="Cache Capacity">
            <input
              type="number"
              value={s.Source.cacheCapacity}
              onChange={(e) =>
                updn("Source", "cacheCapacity", e.target.value)
              }
            />
          </FG>
          <FG label="Mode">
            <input
              type="number"
              value={s.Source.mode}
              min="1"
              max="3"
              onChange={(e) => updn("Source", "mode", e.target.value)}
            />
          </FG>
          <FG label="Max Carried Content">
            <input
              type="number"
              value={s.Source.maxCarriedContent}
              onChange={(e) =>
                updn("Source", "maxCarriedContent", e.target.value)
              }
            />
          </FG>
        </FR>
        <FR>
          <FG label="Ava Cache (min,max)">
            <input
              type="text"
              value={s.Source.avaCache}
              onChange={(e) => updn("Source", "avaCache", e.target.value)}
            />
          </FG>
          <FG label="Static Cache Capacity">
            <input
              type="number"
              value={s.Source.staticCacheCapacity}
              onChange={(e) =>
                updn("Source", "staticCacheCapacity", e.target.value)
              }
            />
          </FG>
          <FG label="Static Cache Range">
            <input
              type="text"
              value={s.Source.staticCacheRange}
              onChange={(e) =>
                updn("Source", "staticCacheRange", e.target.value)
              }
            />
          </FG>
        </FR>
        <FR>
          <FG label="Seed Static Cache">
            <input
              type="number"
              value={s.Source.seedStaticCache}
              onChange={(e) =>
                updn("Source", "seedStaticCache", e.target.value)
              }
            />
          </FG>
          <div className="form-group" style={{ justifyContent: "flex-end" }}>
            <Chk
              id="prodPIT"
              checked={s.Source.enablePIT}
              onChange={(v) => updn("Source", "enablePIT", v)}
              label="Enable PIT"
            />
          </div>
        </FR>
      </fieldset>

      <fieldset>
        <legend>Sink</legend>
        <FR>
          <FG label="Cache Capacity">
            <input
              type="number"
              value={s.Sink.cacheCapacity}
              onChange={(e) =>
                updn("Sink", "cacheCapacity", e.target.value)
              }
            />
          </FG>
          <FG label="Mode">
            <input
              type="number"
              value={s.Sink.mode}
              min="1"
              max="3"
              onChange={(e) => updn("Sink", "mode", e.target.value)}
            />
          </FG>
          <FG label="Seed Query">
            <input
              type="number"
              value={s.Sink.seedQuery}
              onChange={(e) => updn("Sink", "seedQuery", e.target.value)}
            />
          </FG>
        </FR>
        <FR>
          <FG label="Interest Size (bytes)">
            <input
              type="number"
              value={s.Sink.interestSize}
              onChange={(e) => updn("Sink", "interestSize", e.target.value)}
            />
          </FG>
          <FG label="Interval (s)">
            <input
              type="number"
              value={s.Sink.interval}
              onChange={(e) => updn("Sink", "interval", e.target.value)}
            />
          </FG>
          <FG label="Msgs to Generate">
            <input
              type="number"
              value={s.Sink.numOfMsgToGenerate}
              onChange={(e) =>
                updn("Sink", "numOfMsgToGenerate", e.target.value)
              }
            />
          </FG>
        </FR>
        <FR>
          <FG label="Query Range (min,max)">
            <input
              type="text"
              value={s.Sink.queryRange}
              onChange={(e) => updn("Sink", "queryRange", e.target.value)}
            />
          </FG>
          <FG label="Query Distribution">
            <input
              type="number"
              value={s.Sink.queryDistribution}
              onChange={(e) =>
                updn("Sink", "queryDistribution", e.target.value)
              }
            />
          </FG>
          <FG label="Ava Cache (min,max)">
            <input
              type="text"
              value={s.Sink.avaCache}
              onChange={(e) => updn("Sink", "avaCache", e.target.value)}
            />
          </FG>
        </FR>
        <Chk
          id="consPIT"
          checked={s.Sink.enablePIT}
          onChange={(v) => updn("Sink", "enablePIT", v)}
          label="Enable PIT"
        />
      </fieldset>

      <fieldset>
        <legend>Seeder (Relay)</legend>
        <FR>
          <FG label="Cache Capacity">
            <input
              type="number"
              value={s.Seeder.cacheCapacity}
              onChange={(e) =>
                updn("Seeder", "cacheCapacity", e.target.value)
              }
            />
          </FG>
          <FG label="Mode">
            <input
              type="number"
              value={s.Seeder.mode}
              min="1"
              max="3"
              onChange={(e) => updn("Seeder", "mode", e.target.value)}
            />
          </FG>
          <FG label="Ava Cache (min,max)">
            <input
              type="text"
              value={s.Seeder.avaCache}
              onChange={(e) => updn("Seeder", "avaCache", e.target.value)}
            />
          </FG>
        </FR>
        <FR>
          <FG label="Max Carried Content">
            <input
              type="number"
              value={s.Seeder.maxCarriedContent}
              onChange={(e) =>
                updn("Seeder", "maxCarriedContent", e.target.value)
              }
            />
          </FG>
          <div className="form-group" style={{ justifyContent: "flex-end" }}>
            <Chk
              id="interPIT"
              checked={s.Seeder.enablePIT}
              onChange={(v) => updn("Seeder", "enablePIT", v)}
              label="Enable PIT"
            />
          </div>
        </FR>
      </fieldset>

      <div className="page-title" style={{ marginTop: 8 }}>
        Event Generators
      </div>

      {s.events.map((ev, i) => (
        <fieldset key={i}>
          <legend>Event {i + 1}</legend>
          <FR>
            <FG label="Class">
              <select
                value={ev.eventClass}
                onChange={(e) => {
                  const a = [...s.events];
                  a[i] = { ...a[i], eventClass: e.target.value };
                  upd("events", a);
                }}
              >
                {[
                  "MessageEventGenerator",
                  "ExternalEventsQueue",
                  "MessageBurstGenerator",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FG>
            <FG label="Interval (min,max s)">
              <input
                type="text"
                value={ev.interval}
                onChange={(e) => {
                  const a = [...s.events];
                  a[i] = { ...a[i], interval: e.target.value };
                  upd("events", a);
                }}
              />
            </FG>
          </FR>
          <FR>
            <FG label="Size (min,max)">
              <input
                type="text"
                value={ev.size}
                onChange={(e) => {
                  const a = [...s.events];
                  a[i] = { ...a[i], size: e.target.value };
                  upd("events", a);
                }}
              />
            </FG>
            <FG label="Hosts (from,to)">
              <input
                type="text"
                value={ev.hosts}
                onChange={(e) => {
                  const a = [...s.events];
                  a[i] = { ...a[i], hosts: e.target.value };
                  upd("events", a);
                }}
              />
            </FG>
            <FG label="Prefix">
              <input
                type="text"
                value={ev.prefix}
                onChange={(e) => {
                  const a = [...s.events];
                  a[i] = { ...a[i], prefix: e.target.value };
                  upd("events", a);
                }}
              />
            </FG>
          </FR>
          <button
            className="btn btn-danger btn-xs"
            onClick={() =>
              upd(
                "events",
                s.events.filter((_, j) => j !== i),
              )
            }
          >
            Remove Event
          </button>
        </fieldset>
      ))}
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginTop: 4 }}
        onClick={() =>
          upd("events", [
            ...s.events,
            {
              eventClass: "MessageEventGenerator",
              interval: "25,35",
              size: "500k,1M",
              hosts: "0,110",
              prefix: "M",
            },
          ])
        }
      >
        + Add Event Generator
      </button>
    </div>
  );
}

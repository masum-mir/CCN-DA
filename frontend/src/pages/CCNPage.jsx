import { Chk, FG, FR } from "../components/ui/UI.jsx";

export default function CCNPage({ s, upd, updn }) {
  return (
    <div className="tabcontent">
      <div className="page-title">03 · CCN Application Settings</div>

      <fieldset>
        <legend>Producer</legend>
        <FR>
          <FG label="Cache Capacity">
            <input
              type="number"
              value={s.producer.cacheCapacity}
              onChange={(e) =>
                updn("producer", "cacheCapacity", e.target.value)
              }
            />
          </FG>
          <FG label="Mode">
            <input
              type="number"
              value={s.producer.mode}
              min="1"
              max="3"
              onChange={(e) => updn("producer", "mode", e.target.value)}
            />
          </FG>
          <FG label="Max Carried Content">
            <input
              type="number"
              value={s.producer.maxCarriedContent}
              onChange={(e) =>
                updn("producer", "maxCarriedContent", e.target.value)
              }
            />
          </FG>
        </FR>
        <FR>
          <FG label="Ava Cache (min,max)">
            <input
              type="text"
              value={s.producer.avaCache}
              onChange={(e) => updn("producer", "avaCache", e.target.value)}
            />
          </FG>
          <FG label="Static Cache Capacity">
            <input
              type="number"
              value={s.producer.staticCacheCapacity}
              onChange={(e) =>
                updn("producer", "staticCacheCapacity", e.target.value)
              }
            />
          </FG>
          <FG label="Static Cache Range">
            <input
              type="text"
              value={s.producer.staticCacheRange}
              onChange={(e) =>
                updn("producer", "staticCacheRange", e.target.value)
              }
            />
          </FG>
        </FR>
        <FR>
          <FG label="Seed Static Cache">
            <input
              type="number"
              value={s.producer.seedStaticCache}
              onChange={(e) =>
                updn("producer", "seedStaticCache", e.target.value)
              }
            />
          </FG>
          <div className="form-group" style={{ justifyContent: "flex-end" }}>
            <Chk
              id="prodPIT"
              checked={s.producer.enablePIT}
              onChange={(v) => updn("producer", "enablePIT", v)}
              label="Enable PIT"
            />
          </div>
        </FR>
      </fieldset>

      <fieldset>
        <legend>Consumer</legend>
        <FR>
          <FG label="Cache Capacity">
            <input
              type="number"
              value={s.consumer.cacheCapacity}
              onChange={(e) =>
                updn("consumer", "cacheCapacity", e.target.value)
              }
            />
          </FG>
          <FG label="Mode">
            <input
              type="number"
              value={s.consumer.mode}
              min="1"
              max="3"
              onChange={(e) => updn("consumer", "mode", e.target.value)}
            />
          </FG>
          <FG label="Seed Query">
            <input
              type="number"
              value={s.consumer.seedQuery}
              onChange={(e) => updn("consumer", "seedQuery", e.target.value)}
            />
          </FG>
        </FR>
        <FR>
          <FG label="Interest Size (bytes)">
            <input
              type="number"
              value={s.consumer.interestSize}
              onChange={(e) => updn("consumer", "interestSize", e.target.value)}
            />
          </FG>
          <FG label="Interval (s)">
            <input
              type="number"
              value={s.consumer.interval}
              onChange={(e) => updn("consumer", "interval", e.target.value)}
            />
          </FG>
          <FG label="Msgs to Generate">
            <input
              type="number"
              value={s.consumer.numOfMsgToGenerate}
              onChange={(e) =>
                updn("consumer", "numOfMsgToGenerate", e.target.value)
              }
            />
          </FG>
        </FR>
        <FR>
          <FG label="Query Range (min,max)">
            <input
              type="text"
              value={s.consumer.queryRange}
              onChange={(e) => updn("consumer", "queryRange", e.target.value)}
            />
          </FG>
          <FG label="Query Distribution">
            <input
              type="number"
              value={s.consumer.queryDistribution}
              onChange={(e) =>
                updn("consumer", "queryDistribution", e.target.value)
              }
            />
          </FG>
          <FG label="Ava Cache (min,max)">
            <input
              type="text"
              value={s.consumer.avaCache}
              onChange={(e) => updn("consumer", "avaCache", e.target.value)}
            />
          </FG>
        </FR>
        <Chk
          id="consPIT"
          checked={s.consumer.enablePIT}
          onChange={(v) => updn("consumer", "enablePIT", v)}
          label="Enable PIT"
        />
      </fieldset>

      <fieldset>
        <legend>Intermedia (Relay)</legend>
        <FR>
          <FG label="Cache Capacity">
            <input
              type="number"
              value={s.intermedia.cacheCapacity}
              onChange={(e) =>
                updn("intermedia", "cacheCapacity", e.target.value)
              }
            />
          </FG>
          <FG label="Mode">
            <input
              type="number"
              value={s.intermedia.mode}
              min="1"
              max="3"
              onChange={(e) => updn("intermedia", "mode", e.target.value)}
            />
          </FG>
          <FG label="Ava Cache (min,max)">
            <input
              type="text"
              value={s.intermedia.avaCache}
              onChange={(e) => updn("intermedia", "avaCache", e.target.value)}
            />
          </FG>
        </FR>
        <FR>
          <FG label="Max Carried Content">
            <input
              type="number"
              value={s.intermedia.maxCarriedContent}
              onChange={(e) =>
                updn("intermedia", "maxCarriedContent", e.target.value)
              }
            />
          </FG>
          <div className="form-group" style={{ justifyContent: "flex-end" }}>
            <Chk
              id="interPIT"
              checked={s.intermedia.enablePIT}
              onChange={(v) => updn("intermedia", "enablePIT", v)}
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

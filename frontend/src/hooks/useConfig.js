import { useCallback } from "react";
import { parseONEConfig, applyParsedConfig } from "../state/initialState.js";

// calcBatch
export function calcBatch(s) {
  const routers = s.commonGroup.routers.length || 1;
  const seeds = (s.rngSeed.match(/;/g) || []).length + 1;
  const ttls = (s.commonGroup.ttl.match(/;/g) || []).length + 1;
  const bufs = (s.commonGroup.bufferSize.match(/;/g) || []).length + 1;
  return { routers, seeds, ttls, bufs, total: routers * seeds * ttls * bufs };
}

// buildSettingsContent
export function buildSettingsContent(s) {
  console.log("State snapshot:", s);
  let name = s.scenarioName || "TEST";
  if (s.nameAddDateTime) {
    const d = new Date();
    name += `_${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}_${String(d.getDate()).padStart(2, "0")}`;
  }

  const tmpl = `${name}_%%Group.router%%_%%MovementModel.rngSeed%%_%%Group.msgTtl%%_%%Group.bufferSize%%_%%Consumer.queryDistribution%%`;

  let out = `## Scenario settings\n`;
  out += `Scenario.name = ${tmpl}\n`;
  out += `Scenario.simulateConnections = ${s.simulateConnections}\n`;
  out += `Scenario.updateInterval = ${s.updateInterval}\n`;
  out += `Scenario.endTime = ${s.endTime}\n`;
  out += `Scenario.nrofHostGroups = ${s.groups.length}\n\n`;

  out += `## Interface-specific settings\n`;
  for (const iface of s.interfaces) {
    out += `${iface.name}.type = ${iface.type}\n`;
    out += `${iface.name}.transmitSpeed = ${iface.transmitSpeed}\n`;
    out += `${iface.name}.transmitRange = ${iface.transmitRange}\n\n`;
  } 
  
  const routers = s.commonGroup.routers;
  const commonRouter =
    routers.length > 1 ? `[${routers.join("; ")}]` : routers[0] || "CCNRouter";
  let buf = s.commonGroup.bufferSize;
  if (buf.includes(";")) buf = `[${buf}]`;
  let ttl = s.commonGroup.ttl;
  if (ttl.includes(";")) ttl = `[${ttl}]`;
  let rng = s.rngSeed;
  if (rng.includes(";")) rng = `[${rng}]`;

  out += `## Group-specific settings - common\n`;
  out += `Group.movementModel = ${s.commonGroup.movementModel}\n`;
  out += `Group.router = ${commonRouter}\n`;
  out += `CCNRouter.nrofCopies = ${s.ccnRouter.nrofCopies}\n`;
  out += `CCNRouter.binaryMode = ${s.ccnRouter.binaryMode}\n`;
  out += `Group.bufferSize = ${buf}\n`;
  out += `Group.waitTime = ${s.commonGroup.waitTime}\n`;
  out += `Group.nrofInterfaces = 1\n`;
  out += `Group.interface1 = ${s.commonGroup.interface}\n`;
  out += `Group.speed = ${s.commonGroup.speed}\n`;
  out += `Group.msgTtl = ${ttl}\n\n`; 
 
  // Producer Application  
  out += `## Producer Application\n`;
  out += `Producer.type = CCN_application\n`;
  out += `Producer.cacheCapacity = ${s.producer.cacheCapacity}\n`;
  out += `Producer.mode = ${s.producer.mode}\n`;
  out += `Producer.avaCache = ${s.producer.avaCache}\n`;
  out += `Producer.maxCarriedContent = ${s.producer.maxCarriedContent}\n`;
  out += `Producer.staticCacheCapacity = ${s.producer.staticCacheCapacity}\n`;
  out += `Producer.staticCacheRange = ${s.producer.staticCacheRange}\n`;
  out += `Producer.seedStaticCache = ${s.producer.seedStaticCache}\n`;
  out += `Producer.enablePIT = ${s.producer.enablePIT}\n\n`;
 
  const producerGroups   = s.groups.filter((g) => (g.applicationType || "") === "Producer");
  const consumerGroups   = s.groups.filter((g) => (g.applicationType || "") === "Consumer");
  const intermediaGroups = s.groups.filter((g) => (g.applicationType || "") === "Intermedia");
  console.log(
    `📦 Group breakdown — Producer: ${producerGroups.length}, Consumer: ${consumerGroups.length}, Intermedia: ${intermediaGroups.length}`,
  );
  const noType = s.groups.filter((g) => !g.applicationType);
  if (noType.length)
    console.warn("⚠️ Groups with no applicationType (will be skipped):", noType);
 
  // Per-group - Producers
  s.groups.forEach((g, i) => {
    if ((g.applicationType || "") !== "Producer") return;
    const n = i + 1;
    console.log(`  ✅ Producer → Group${n}`, g);
    out += `Group${n}.nrofApplications = 1\n`;
    out += `Group${n}.application1 = Producer\n`;
    out += `Group${n}.nrofHosts = ${g.numHosts}\n`;
    out += `Group${n}.movementModel = ${g.movementModel}\n`;
    if (g.nodeLocation) out += `Group${n}.nodeLocation = ${g.nodeLocation}\n`;
    out += `Group${n}.groupID = ${g.groupID}\n`;
    out += `Group${n}.nrofInterfaces = 1\n`;
    out += `Group${n}.interface1 = ${g.interface1 || "highspeedInterface"}\n`;
    if (g.bufferSize) out += `Group${n}.bufferSize = ${g.bufferSize}\n`;
    out += `Group${n}.speed = ${g.speed !== undefined && g.speed !== "" ? g.speed : "0,0"}\n`;
    out += "\n";
  });
 
  // Consumer Application
  out += `## Consumer Application\n`;
  out += `Consumer.type = CCN_application\n`;
  out += `Consumer.mode = ${s.consumer.mode}\n`;
  out += `Consumer.cacheCapacity = ${s.consumer.cacheCapacity}\n`;
  out += `Consumer.seedQuery = ${s.consumer.seedQuery}\n`;
  out += `Consumer.interestSize = ${s.consumer.interestSize}\n`;
  out += `Consumer.interval = ${s.consumer.interval}\n`;
  out += `Consumer.numOfMsgToGenerate = ${s.consumer.numOfMsgToGenerate}\n`;
  out += `Consumer.queryRange = ${s.consumer.queryRange}\n`;
  out += `Consumer.queryDistribution = ${s.consumer.queryDistribution}\n`;
  out += `Consumer.avaCache = ${s.consumer.avaCache}\n`;
  out += `Consumer.maxCarriedContent = ${s.consumer.maxCarriedContent}\n`;
  out += `Consumer.enablePIT = ${s.consumer.enablePIT}\n\n`;
 
  s.groups.forEach((g, i) => {
    if ((g.applicationType || "") !== "Consumer") return;
    const n = i + 1; 
    out += `Group${n}.nrofApplications = 1\n`;
    out += `Group${n}.application1 = Consumer\n`;
    out += `Group${n}.nrofHosts = ${g.numHosts}\n`;
    out += `Group${n}.groupID = ${g.groupID}\n`;
    out += `Group${n}.nrofInterfaces = 1\n`;
    out += `Group${n}.interface1 = ${g.interface1 || "btInterface"}\n`;
    out += "\n";
  });
 
  // Intermediate relay nodes 
  out += `## Intermediate relay nodes\n`;
  out += `Intermedia.type = CCN_application\n`;
  out += `Intermedia.cacheCapacity = ${s.intermedia.cacheCapacity}\n`;
  out += `Intermedia.mode = ${s.intermedia.mode}\n`;
  out += `Intermedia.avaCache = ${s.intermedia.avaCache}\n`;
  out += `Intermedia.maxCarriedContent = ${s.intermedia.maxCarriedContent}\n`;
  out += `Intermedia.enablePIT = ${s.intermedia.enablePIT}\n\n`;
 
  s.groups.forEach((g, i) => {
    if ((g.applicationType || "") !== "Intermedia") return;
    const n = i + 1; 
    out += `Group${n}.nrofApplications = 1\n`;
    out += `Group${n}.application1 = Intermedia\n`;
    out += `Group${n}.nrofHosts = ${g.numHosts}\n`;
    out += `Group${n}.groupID = ${g.groupID}\n`;
    out += `Group${n}.movementModel = ${g.movementModel}\n`;
    if (g.bufferSize) out += `Group${n}.bufferSize = ${g.bufferSize}\n`;
    if (g.movementModel === "MapRouteMovement") {
      if (g.routeFile) out += `Group${n}.routeFile = ${g.routeFile}\n`;
      if (g.routeType && g.routeType !== "0" && g.routeType !== 0)
        out += `Group${n}.routeType = ${g.routeType}\n`;
    }
    if (g.waitTime) out += `Group${n}.waitTime = ${g.waitTime}\n`;
    if (g.speed !== undefined && g.speed !== "")
      out += `Group${n}.speed = ${g.speed}\n`;
    if (g.okMaps) out += `Group${n}.okMaps = ${g.okMaps}\n`;
    out += `Group${n}.nrofInterfaces = 1\n`;
    out += `Group${n}.interface1 = ${g.interface1 || "btInterface"}\n`;
    out += "\n";
  });
 

  out += `## Message creation parameters\nEvents.nrof = ${s.events.length}\n`;
  s.events.forEach((ev, i) => {
    const n = i + 1;
    out += `Events${n}.class = ${ev.eventClass}\n`;
    out += `Events${n}.interval = ${ev.interval}\n`;
    out += `Events${n}.size = ${ev.size}\n`;
    out += `Events${n}.hosts = ${ev.hosts}\n`;
    out += `Events${n}.prefix = ${ev.prefix}\n`;
  });

  out += `\n## Movement model settings\n`;
  out += `MovementModel.rngSeed = ${rng}\n`;
  out += `MovementModel.worldSize = ${s.worldSize}\n`;
  out += `MovementModel.warmup = ${s.warmup}\n\n`;

  out += `## Map based movement settings\n`;
  out += `MapBasedMovement.nrofMapFiles = ${s.mapFiles.length}\n`;
  s.mapFiles.forEach((f, i) => {
    out += `MapBasedMovement.mapFile${i + 1} = data/${f}\n`;
  });

  out += `\n## Reports\n`;
  out += `Report.nrofReports = ${s.reports.length}\n`;
  out += `Report.warmup = ${s.reportWarmup}\n`;
  out += `Report.reportDir = ${s.reportDir}\n`;
  s.reports.forEach((r, i) => {
    out += `Report.report${i + 1} = ${r}\n`;
  });

  out += `\n## Optimization settings\n`;
  out += `Optimization.cellSizeMult = ${s.optimization.cellSizeMult}\n`;
  out += `Optimization.randomizeUpdateOrder = ${s.optimization.randomizeUpdateOrder}\n\n`;

  out += `## GUI settings\n`;
  out += `GUI.UnderlayImage.fileName = data/${s.guiImageFile}\n`;
  out += `GUI.UnderlayImage.offset = ${s.guiImageOffset}\n`;
  out += `GUI.UnderlayImage.scale = ${s.guiImageScale}\n`;
  out += `GUI.UnderlayImage.rotate = ${s.guiImageRotate}\n`;
  out += `GUI.EventLogPanel.nrofEvents = ${s.guiEventLogEvents}\n\n`;

  out += `## Router settings\n`;
  out += `SprayAndWaitRouter.nrofCopies = ${s.sprayWait.nrofCopies}\n`;
  out += `SprayAndWaitRouter.binaryMode = ${s.sprayWait.binaryMode}\n`;
  out += `ProphetRouter.secondsInTimeUnit = ${s.prophet.secondsInTimeUnit}\n`;

  return out;
}

// Hook
export function useConfig(s, upd, setS) {
  const handleImport = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      upd("importStatus", { ok: null, msg: "Importing…" });
      const reader = new FileReader();
      reader.onload = (ev) => {
        console.log("EV::: ",ev);
        try {
          applyParsedConfig(parseONEConfig(ev.target.result), setS);
        } catch (err) {
          upd("importStatus", {
            ok: false,
            msg: "Import failed: " + err.message,
          });
        }
      };
      reader.onerror = () =>
        upd("importStatus", { ok: false, msg: "Error reading file" });
      reader.readAsText(file);
      e.target.value = "";
    },
    [upd, setS],
  );

  const handlePreview = useCallback(() => buildSettingsContent(s), [s]);

  return { handleImport, handlePreview };
}

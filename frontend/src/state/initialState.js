import { DEFAULT_GROUPS, DEFAULT_INTERFACES } from "./defaults.js";

export function initState() {
  return {
    scenarioName: "TEST",
    nameAddDateTime: false,
    simulateConnections: true,
    updateInterval: 0.1,
    endTime: 2000,

    interfaces: DEFAULT_INTERFACES.map((i) => ({ ...i })),
    newIface: {
      name: "",
      type: "SimpleBroadcastInterface",
      transmitSpeed: "",
      transmitRange: "",
    },

    Source: {
      cacheCapacity: 5000,
      mode: 2,
      avaCache: "1,1",
      maxCarriedContent: 1,
      staticCacheCapacity: 50,
      staticCacheRange: "1,200",
      seedStaticCache: 36,
      enablePIT: true,
    },
    Sink: {
      cacheCapacity: 5000,
      mode: 1,
      seedQuery: 12,
      interestSize: 50,
      interval: 100,
      numOfMsgToGenerate: 20,
      queryRange: "1,200",
      queryDistribution: 2,
      avaCache: "0,1",
      maxCarriedContent: 1,
      enablePIT: true,
    },
    Seeder: {
      cacheCapacity: 500,
      mode: 3,
      avaCache: "0,1",
      maxCarriedContent: 1,
      enablePIT: true,
    },

    groups: DEFAULT_GROUPS.map((g) => ({ ...g })),
    commonGroup: {
      movementModel: "ShortestPathMapBasedMovement",
      routers: ["CCNRouter"],
      bufferSize: "4M",
      waitTime: "0, 120",
      speed: "0.5, 1.5",
      nrofHosts: 20,
      ttl: "50; 100; 150",
      interface: "btInterface",
    },
    ccnRouter: { nrofCopies: 10, binaryMode: true },
    sprayWait: { nrofCopies: 6, binaryMode: true },
    prophet: { secondsInTimeUnit: 30 },
    optimization: { cellSizeMult: 5, randomizeUpdateOrder: true },

    newGroup: {
      groupID: "",
      numHosts: "",
      movementModel: "ShortestPathMapBasedMovement",
      routeFile: "",
      routeType: 1,
      router: "CCNRouter",
      bufferSize: "",
      msgTtl: "50",
      waitTime: "",
      speed: "0,0",
      activeTimes: "0",
      applicationType: "Source",
      interface1: "highspeedInterface",
      nodeLocation: "",
      okMaps: "",
    },

    reports: ["CCNApplicationReporter", "MessageStatsReport"],
    reportClass: "CCNApplicationReporter",
    reportWarmup: 0,
    reportDir: "reports/",

    rngSeed: "13",
    worldSize: "4500, 3400",
    warmup: 1000,
    mapFiles: [
      "roads.wkt",
      "main_roads.wkt",
      "pedestrian_paths.wkt",
      "shops.wkt",
    ],
    guiImageOffset: "64, 20",
    guiImageScale: 4.75,
    guiImageRotate: -0.015,
    guiEventLogEvents: 100,
    guiImageFile: "helsinki_underlay.png",

    events: [
      {
        eventClass: "MessageEventGenerator",
        interval: "25,35",
        size: "500k,1M",
        hosts: "0,110",
        prefix: "M",
      },
    ],

    // WKT generator
    wktLocation: "",
    wktMapSize: 5000,
    wktDetail: "detailed",
    wktOutputName: "",
    wktStatus: null,

    // Post-processing
    compileFirst: false,
    batchFolder: "reports/",
    analysisPlotsDir: "plots/",
    batchExtension: ".txt",
    batchDelimiter: "_",
    batchDataSeparator: ":",
    batchPrecision: 4,
    batchComponents: [],
    analysisReportTypePos: 0,
    analysisRouterPos: 1,
    analysisGroupingTypePos: -1,

    // Runtime
    simStatus: "idle",
    consoleLogs: [],
    simError: "",
    importStatus: null,
    pipelineStep: null,
    averaged: null,
    analysis: null,
    regression: null,
    savedPlots: null,
    plotsDir: null,
    results: null,
  };
}

// ONE config file parser

export function parseONEConfig(text) {
  const cfg = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;
    const m = line.match(/^([^=]+)\s*=\s*(.+)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (val.startsWith("[") && val.endsWith("]"))
      val = val
        .slice(1, -1)
        .split(";")
        .map((v) => v.trim());
    cfg[m[1].trim()] = val;
  }
  return cfg;
}

function joinArr(v) {
  return Array.isArray(v) ? v.join("; ") : v || "";
}

export function applyParsedConfig(cfg, setS) {
  setS((prev) => {
    const s = { ...prev };
    console.log("SS:: ", s);
    const get = (k) => cfg[k];
    const setf = (obj, field, key) => {
      const v = get(key);
      if (v !== undefined) obj[field] = Array.isArray(v) ? v.join("; ") : v;
    };
    const setb = (obj, field, key) => {
      const v = get(key);
      if (v !== undefined) obj[field] = v === "true" || v === true;
    };

    if (get("Scenario.name"))
      s.scenarioName = String(get("Scenario.name"))
        .replace(/_%%.+%%/g, "")
        .replace(/^_/, "");
    setf(s, "updateInterval", "Scenario.updateInterval");
    setf(s, "endTime", "Scenario.endTime");
    setb(s, "simulateConnections", "Scenario.simulateConnections");
    setf(s, "rngSeed", "MovementModel.rngSeed");
    setf(s, "worldSize", "MovementModel.worldSize");
    setf(s, "warmup", "MovementModel.warmup");

    const cg = { ...s.commonGroup };
    
    if (get("Group.router")) {
      let r = get("Group.router");
      if (typeof r === "string")
        r = r
          .replace(/[\[\]]/g, "")
          .split(";")
          .map((x) => x.trim())
          .filter(Boolean);
      cg.routers = r;
    }
    if (get("Group.bufferSize")) {
      let b = get("Group.bufferSize");
      if (Array.isArray(b)) b = b.join("; ");
      else b = b.replace(/[\[\]]/g, "").trim();
      cg.bufferSize = b;
    }
    if (get("Group.msgTtl")) cg.ttl = joinArr(get("Group.msgTtl"));
    if (get("Group.waitTime")) cg.waitTime = get("Group.waitTime");
    if (get("Group.speed")) cg.speed = get("Group.speed");
    s.commonGroup = cg;

    const cr = { ...s.ccnRouter };
    setf(cr, "nrofCopies", "CCNRouter.nrofCopies");
    setb(cr, "binaryMode", "CCNRouter.binaryMode");
    s.ccnRouter = cr;

    const prod = { ...s.Source };
    [
      "cacheCapacity",
      "mode",
      "avaCache",
      "maxCarriedContent",
      "staticCacheCapacity",
      "staticCacheRange",
      "seedStaticCache",
    ].forEach((f) => setf(prod, f, `Source.${f}`));
    setb(prod, "enablePIT", "Source.enablePIT");
    s.Source = prod;

    const cons = { ...s.Sink };
    [
      "cacheCapacity",
      "mode",
      "seedQuery",
      "interestSize",
      "interval",
      "numOfMsgToGenerate",
      "queryRange",
      "queryDistribution",
      "avaCache",
      "maxCarriedContent",
    ].forEach((f) => setf(cons, f, `Sink.${f}`));
    setb(cons, "enablePIT", "Sink.enablePIT");
    s.Sink = cons;

    const inter = { ...s.Seeder };
    ["cacheCapacity", "mode", "avaCache", "maxCarriedContent"].forEach((f) =>
      setf(inter, f, `Seeder.${f}`),
    );
    setb(inter, "enablePIT", "Seeder.enablePIT");
    s.Seeder = inter;

    const opt = { ...s.optimization };
    setf(opt, "cellSizeMult", "Optimization.cellSizeMult");
    setb(opt, "randomizeUpdateOrder", "Optimization.randomizeUpdateOrder");
    s.optimization = opt;

    s.importStatus = { ok: true, msg: "✓ Config imported" };
    return s;
  });
}

import os, re, json, subprocess, threading, time, sys
from pathlib import Path
from collections import defaultdict

# Ensure the directory containing app.py is on sys.path so that
# averager.py and analysis.py (placed alongside app.py) are importable
# regardless of where Python is invoked from.
_APP_DIR = Path(__file__).resolve().parent
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from flask import Flask, request, jsonify, Response, stream_with_context, send_file, abort
from flask_cors import CORS

# Import modular pipeline components
from averager import (
    ReportAverager,
    read_and_parse_file_parallel,
    average_group_data,
)
from analysis import (
    load_config as _load_analysis_config_from_file,
    SmartFileParser,
    DataOrganizer,
    PlotStrategy,
    PlotGenerator,
    execute_plot_job,
    _init_worker,
)
from multiprocessing import Pool
import traceback as _traceback

# Constants derived locally (no longer imported from deleted modules)
# Metrics per report type (used for startup summary and elsewhere)
REPORT_METRICS: dict = {
    "MessageStatsReport": [
        "created", "started", "relayed", "dropped",
        "delivery_prob", "overhead_ratio",
        "latency_avg", "latency_med",
        "hopcount_avg", "hopcount_med",
        "buffertime_avg", "buffertime_med",
    ],
    "CCN_application_reporter": [
        "query_count", "response_count", "interest_satisfaction_rate",
        "static_cache_hit", "static_cache_miss",
        "oppo_cache_hit", "oppo_cache_miss",
        "drop_pit", "drop_nonce", "drop_list",
        "duplicated_query", "average_interval",
        "retrieval_latency_reduction", "caching_gain_index",
    ],
}

# Human-readable metric labels
METRIC_LABELS: dict = {
    "delivery_prob":               "Delivery Probability",
    "overhead_ratio":              "Overhead Ratio",
    "latency_avg":                 "Average Latency (s)",
    "latency_med":                 "Median Latency (s)",
    "hopcount_avg":                "Average Hop Count",
    "hopcount_med":                "Median Hop Count",
    "buffertime_avg":              "Average Buffer Time (s)",
    "buffertime_med":              "Median Buffer Time (s)",
    "created":                     "Messages Created",
    "started":                     "Transfers Started",
    "relayed":                     "Messages Relayed",
    "dropped":                     "Messages Dropped",
    "query_count":                 "Query Count",
    "response_count":              "Response Count",
    "interest_satisfaction_rate":  "Interest Satisfaction Rate",
    "static_cache_hit":            "Static Cache Hits",
    "static_cache_miss":           "Static Cache Misses",
    "oppo_cache_hit":              "Opportunistic Cache Hits",
    "oppo_cache_miss":             "Opportunistic Cache Misses",
    "drop_pit":                    "Dropped (PIT)",
    "drop_nonce":                  "Dropped (Nonce)",
    "drop_list":                   "Dropped (List)",
    "duplicated_query":            "Duplicated Queries",
    "average_interval":            "Average Interval (s)",
    "retrieval_latency_reduction": "Retrieval Latency Reduction",
    "caching_gain_index":          "Caching Gain Index",
}

COLORS:  list = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f"]
MARKERS: list = ["o","s","^","D","v","P","X","*"]

# Fields that are never averaged
GLOBAL_IGNORE: set = {"sim_time"}

# Default batch / averager config applied when no batch_config.json exists
DEFAULT_BATCH_CFG: dict = {
    "data_separator": ":",
    "ignore_fields":  list(GLOBAL_IGNORE),
    "group_by":       ["router", "distribution"],
    "min_seeds":      1,
    "output":         {"precision": 4},
    # averager_config.json required keys (ReportAverager.validate_config checks these)
    "folder":         "reports/",
    "filename_pattern": {
        "delimiter":  "_",
        "components": {
            "scenario_name": 0,
            "router":        1,
            "seed":          2,
            "ttl":           3,
            "buffer":        4,
            "distribution":  5,
            "report_type":   6,
        },
        "extract": {"ttl": r"(\d+)", "seed": r"(\d+)", "buffer": r"(\d+)"},
    },
    "average_groups": [
        {
            "name":            "ttl_average",
            "group_by":        ["router", "ttl"],
            "min_files":       2,
            "output_template": "{report_type}_{router}_{ttl}_ttl_average.txt",
        },
        {
            "name":            "buffer_average",
            "group_by":        ["router", "buffer"],
            "min_files":       2,
            "output_template": "{report_type}_{router}_{buffer}_buffer_average.txt",
        },
    ],
    "report_types": ["MessageStatsReport", "CCN_application_reporter"],
}

# Default analysis config applied when no analysis_config.json exists
DEFAULT_ANALYSIS_CFG: dict = {
    "data_separator": ":",
    "directories":    {"report_dir": "reports/", "plots_dir": "plots/"},
    "file_patterns":  {"report_extension": ".txt"},
    "report_types":   ["MessageStatsReport", "CCN_application_reporter"],
    "enabled_plots":  {
        "line_plots":   True,
        "violin_plots": True,
        "3d_surface":   False,
        "heatmaps":     True,
        "pairplot":     True,
        "export_csv":   False,
    },
    "plot_thresholds": {
        "min_files_for_heatmap":  2,
        "min_values_for_line":    2,
        "min_values_for_surface": 3,
    },
    "metrics": {
        "include": [
            "delivery_prob","overhead_ratio","latency_avg","latency_med",
            "hopcount_avg","hopcount_med","buffertime_avg","buffertime_med",
            "created","started","relayed","dropped",
            "query_count","response_count","interest_satisfaction_rate",
            "static_cache_hit","static_cache_miss",
            "oppo_cache_hit","oppo_cache_miss",
            "drop_pit","drop_nonce","drop_list",
            "duplicated_query","average_interval",
            "retrieval_latency_reduction","caching_gain_index",
        ],
        "ignore": [],
    },
    "grouping_labels": {
        "buffer":  "Buffer Size (MB)",
        "ttl":     "TTL (seconds)",
        "timeout": "Timeout (seconds)",
        "distro":  "Query Distribution",
        "default": "Parameter Value",
    },
    "filename_structure": {
        "delimiter": "_",
        "average_files": {
            "grouping_type_position": -1,
            "report_type_position":   0,
            "router_position":        1,
            "value_positions":        [2],
        },
        "raw_files": {
            "positions": {
                "prefix":      0,
                "router":      1,
                "seed":        2,
                "ttl":         3,
                "buffer":      4,
                "report_type": 5,
            }
        },
    },
    "plot_settings": {
        "general":     {"dpi": 150},
        "line_plots":  {
            "size": [10, 6], "marker_size": 10,
            "markers": ["o","s","^","D","v","*","P","X"],
            "font_sizes": {"axis_label": 14, "legend": 11, "ticks": 10},
        },
        "violin_plots": {
            "size": [12, 7],
            "font_sizes": {"axis_label": 13, "ticks": 11},
            "style": {
                "palette": "Spectral", "inner": "quartile",
                "line_width": 2, "quartile_line_width": 3,
                "width": 0.8, "gap": 0.1,
            },
        },
        "heatmaps": {
            "font_sizes": {"annotations": 11, "colorbar": 11, "ticks": 10},
            "style": {"cmap": "Blues", "vmin": -1, "vmax": 1},
        },
        "pairplot": {
            "size": [18, 18],
            "font_sizes": {"axis_label": 11, "legend": 10, "ticks": 10},
            "style": {
                "diag_kind": "kde", "alpha": 0.6, "marker_size": 40,
                "palette": "tab10", "edge_color": "white", "edge_width": 0.3,
            },
        },
        "3d_surface": {
            "size": [14, 10],
            "font_sizes": {"axis_label": 12, "colorbar": 11, "ticks": 10},
            "style": {"cmap": "viridis", "alpha": 0.85, "edge_color": "none", "line_width": 0},
            "view": {"elev": 30, "azim": 140},
        },
    },
}

GROUPING_LABELS: dict = DEFAULT_ANALYSIS_CFG["grouping_labels"]


# Pipeline helpers
def _run_averager_pipeline(reports_dir: Path, batch_cfg: dict) -> dict:
    """
    Step 3: Use ReportAverager to produce averaged .txt files in reports_dir.

    Builds a temporary config dict compatible with ReportAverager, writes it
    to a temp JSON file, instantiates the averager, and calls run().

    Returns a summary dict with keys 'processed', 'skipped', 'output_files'.
    """
    import tempfile, copy

    cfg = copy.deepcopy(DEFAULT_BATCH_CFG)
    cfg.update(batch_cfg)
    # Point folder at the actual reports directory
    cfg["folder"] = str(reports_dir) + "/"

    # Write temp config so ReportAverager can load it
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json",
                                     delete=False, encoding="utf-8") as tf:
        json.dump(cfg, tf)
        tmp_path = tf.name

    try:
        averager = ReportAverager(tmp_path, safety_enabled=True)
        averager.run()
        # Collect generated average files
        avg_files = [str(p) for p in reports_dir.glob("*_average.txt")]
        return {"processed": len(avg_files), "skipped": 0, "output_files": avg_files}
    except Exception as exc:
        _traceback.print_exc()
        return {"error": str(exc), "processed": 0, "skipped": 0, "output_files": []}
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def _run_analysis_plots(reports_dir: Path, plots_base: Path, analysis_cfg: dict) -> dict:
    """
    Step 4: Use analysis.py (SmartFileParser / DataOrganizer / PlotStrategy /
    PlotGenerator) to generate all plots.

    Returns {"total": int, "saved": [abs_path, ...], "by_type": {folder: [paths]}}
    """
    import copy

    cfg = copy.deepcopy(DEFAULT_ANALYSIS_CFG)

    # Merge caller-supplied config on top
    for k, v in analysis_cfg.items():
        if isinstance(v, dict) and isinstance(cfg.get(k), dict):
            cfg[k].update(v)
        else:
            cfg[k] = v

    # Always override directories to the actual runtime paths
    cfg["directories"]["report_dir"] = str(reports_dir)
    cfg["directories"]["plots_dir"]  = str(plots_base)

    # Normalise enabled_plots keys
    ep = cfg.get("enabled_plots", {})
    cfg["enabled_plots"] = {
        "line_plots":   ep.get("line_plots",   ep.get("line",    True)),
        "violin_plots": ep.get("violin_plots", ep.get("violin",  True)),
        "3d_surface":   ep.get("3d_surface",   ep.get("surface", False)),
        "heatmaps":     ep.get("heatmaps",     ep.get("heatmap", True)),
        "pairplot":     ep.get("pairplot",     ep.get("pair",    True)),
        "export_csv":   ep.get("export_csv",   False),
    }

    plots_base = Path(plots_base)
    plots_base.mkdir(parents=True, exist_ok=True)

    try:
        parser    = SmartFileParser(cfg)
        organizer = DataOrganizer(parser)
        strategy  = PlotStrategy(cfg)

        averaged_dfs = organizer.load_averaged_files()
        raw_df       = organizer.load_raw_files()

        avg_strategy = strategy.analyze_averaged_data(averaged_dfs)

        plot_jobs = []

        ps = cfg.get("plot_settings", {})

        def _ps(key):
            return (ps.get(key)
                    or ps.get(key + "_plots")
                    or ps.get(key.replace("_plots", ""))
                    or {})

        line_cfg    = _ps("line_plots")
        violin_cfg  = _ps("violin_plots")
        surface_cfg = _ps("3d_surface")
        heatmap_cfg = _ps("heatmaps")
        pair_cfg    = _ps("pairplot")

        if cfg["enabled_plots"].get("line_plots", True):
            for grouping_type, df in avg_strategy["line_plots"]:
                for metric in cfg["metrics"]["include"]:
                    if metric in df.columns:
                        plot_jobs.append(("line", (grouping_type, df, metric, line_cfg)))

        if cfg["enabled_plots"].get("3d_surface", False):
            for grouping_types, dfs in avg_strategy["surface_plots"]:
                for metric in cfg["metrics"]["include"]:
                    plot_jobs.append(("surface", (grouping_types, dfs, metric, surface_cfg)))

        if cfg["enabled_plots"].get("violin_plots", True):
            for grouping_type, df in avg_strategy["line_plots"]:
                for metric in cfg["metrics"]["include"]:
                    if metric in df.columns:
                        plot_jobs.append(("violin", (grouping_type, df, metric, violin_cfg)))

        if (cfg["enabled_plots"].get("heatmaps", True)
                and raw_df is not None
                and "router" in raw_df.columns):
            for router in raw_df["router"].unique():
                router_df = raw_df[raw_df["router"] == router]
                plot_jobs.append(("heatmap", (router, router_df,
                                              cfg["metrics"]["include"],
                                              str(plots_base),
                                              heatmap_cfg)))

        if cfg["enabled_plots"].get("pairplot", True) and raw_df is not None:
            plot_jobs.append(("pairplot", (raw_df,
                                           cfg["metrics"]["include"],
                                           str(plots_base),
                                           pair_cfg)))

        if not plot_jobs:
            return {
                "total": 0, "saved": [], "by_type": {},
                "warning": "No plot jobs generated — check averaged files.",
            }

        num_workers = min(max(1, (os.cpu_count() or 2) // 2), len(plot_jobs), 4)
        with Pool(processes=num_workers,
                  initializer=_init_worker,
                  initargs=(cfg, str(plots_base))) as pool:
            pool.map(execute_plot_job, plot_jobs)

        # Collect all generated PNG files
        saved = [str(p) for p in sorted(plots_base.rglob("*.png"))]

        # Group by sub-folder (report type)
        by_type: dict = {}
        for p in saved:
            rel = Path(p).relative_to(plots_base)
            rt  = rel.parts[0] if len(rel.parts) > 1 else "plots"
            by_type.setdefault(rt, []).append(p)

        return {"total": len(saved), "saved": saved, "by_type": by_type}

    except Exception as exc:
        _traceback.print_exc()
        return {"error": str(exc), "total": 0, "saved": [], "by_type": {}}


# Flask app
app  = Flask(__name__)
CORS(app)

# Paths
BASE_DIR      = Path(__file__).parent.parent.parent
SIMULATOR_DIR = BASE_DIR / "simulator"
REPORTS_DIR   = SIMULATOR_DIR / "reports"
CONFIGS_DIR   = SIMULATOR_DIR / "user_configs"
CONFIGS_DIR.mkdir(parents=True, exist_ok=True)

_API_DIR          = Path(__file__).parent
BATCH_CFG_PATH    = _API_DIR / "batch_config.json"
ANALYSIS_CFG_PATH = _API_DIR / "analysis_config.json"

_processes: dict = {}
_lock = threading.Lock()

# CONFIG LOADING
def _load_json(path: Path) -> dict:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as e:
        print(f"  [config] {path.name} invalid JSON: {e}")
        return {}


def load_batch_config() -> dict:
    """Load batch/averager config, merging file values over defaults."""
    import copy
    raw     = _load_json(BATCH_CFG_PATH)
    default = copy.deepcopy(DEFAULT_BATCH_CFG)
    default["ignore_fields"] = list(GLOBAL_IGNORE)
    default.update(raw)
    return default


def load_analysis_config() -> dict:
    """Load analysis config, merging file values over defaults."""
    import copy
    raw     = _load_json(ANALYSIS_CFG_PATH)
    default = copy.deepcopy(DEFAULT_ANALYSIS_CFG)
    default["grouping_labels"] = dict(GROUPING_LABELS)
    default["plots_dir"] = "plots"
    for k, v in raw.items():
        default[k] = v
    return default

# MISC HELPERS
def _sse(d: dict) -> str:
    return f"data: {json.dumps(d)}\n\n"

def is_windows() -> bool:
    return os.name == "nt"

def one_command(cfg_rel: str, batch: bool, n: int = 1) -> list:
    script_name = "one.bat" if is_windows() else "one.sh"
    s = str(SIMULATOR_DIR / script_name)
    return [s, "-b", str(n), cfg_rel] if batch else [s, cfg_rel]

def build_config_lines(config: dict) -> str:
    sections = {
        "Scenario":[],"Interface":[],"Group":[],"MovementModel":[],
        "MapBasedMovement":[],"Producer":[],"Consumer":[],"Intermedia":[],
        "Report":[],"Events":[],"Optimization":[],"GUI":[],"Other":[],
    }
    order = list(sections.keys())
    for key, value in config.items():
        prefix = re.sub(r"\d+$", "", key.split(".")[0])
        bucket = next((s for s in order if prefix.lower().startswith(s.lower())), "Other")
        sections[bucket].append(f"{key} = {value}")
    lines = []
    for sec, entries in sections.items():
        if not entries: continue
        lines.append(f"## {sec} settings")
        lines.extend(entries); lines.append("")
    return "\n".join(lines)

def parse_report_file(content: str) -> dict:
    stats = {}; raw = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"): continue
        for sep in (":", "="):
            if sep in line:
                k, v = line.split(sep, 1)
                if k.strip(): stats[k.strip()] = v.strip()
                break
        else:
            raw.append(line)
    return {"stats": stats, "raw_lines": raw}

def _rel(p: str) -> str:
    try:   return str(Path(p).relative_to(SIMULATOR_DIR))
    except: return p

# FLASK ROUTES
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "simulator_dir":   str(SIMULATOR_DIR),
        "batch_config":    str(BATCH_CFG_PATH)    + (" ✓" if BATCH_CFG_PATH.exists()    else " ✗"),
        "analysis_config": str(ANALYSIS_CFG_PATH) + (" ✓" if ANALYSIS_CFG_PATH.exists() else " ✗"),
        "pipeline": [
            "Step 1: ONE simulation → raw .txt files in reports/",
            "Step 2: ReportAverager.run() → *_average.txt files in reports/",
            "Step 3: analysis.py pipeline → PNG plots in plots/<type>/",
        ],
    })


@app.route("/api/generate-config", methods=["POST"])
def generate_config():
    data = request.json or {}
    cfg  = data.get("config")
    if not cfg or not isinstance(cfg, dict):
        return jsonify({"error": "Missing config object"}), 400
    content = build_config_lines(cfg)
    fn  = f"user_config_{int(time.time()*1000)}.txt"
    fp  = CONFIGS_DIR / fn
    fp.write_text(content, encoding="utf-8")
    return jsonify({"filename": fn, "filepath": str(fp), "content": content})


@app.route("/api/run-simulation", methods=["POST"])
def run_simulation():
    data = request.json or {}
    if "filename" in data:
        cp = CONFIGS_DIR / data["filename"]
        if not cp.exists():
            return jsonify({"error": f"Config not found: {data['filename']}"}), 404
    elif "config" in data:
        content = build_config_lines(data["config"])
        fn = f"user_config_{int(time.time()*1000)}.txt"; cp = CONFIGS_DIR / fn
        cp.write_text(content, encoding="utf-8")
    else:
        content = data.get("content", "")
        fn = data.get("settings_filename", f"user_config_{int(time.time()*1000)}.txt")
        cp = CONFIGS_DIR / fn; cp.write_text(content, encoding="utf-8")

    rel      = cp.relative_to(SIMULATOR_DIR)
    n        = int(data.get("batch_count", 1)) or 1
    is_batch = n > 1; do_compile = data.get("compile", False)

    def gen():
        if do_compile:
            yield _sse({"type": "step", "message": "Compiling ONE…"})
            _compile_script = SIMULATOR_DIR / ("compile.bat" if is_windows() else "compile.sh")
            if not _compile_script.exists():
                yield _sse({"type": "log", "level": "warning",
                             "message": f"compile script not found at {_compile_script}, skipping."})
            else:
                r = subprocess.run(
                    (["bash", str(_compile_script)] if not is_windows() else [str(_compile_script)]),
                    cwd=str(SIMULATOR_DIR), capture_output=True, text=True, timeout=120)
                if r.returncode != 0:
                    yield _sse({"type": "log", "level": "error", "message": r.stderr[:500]})
                    yield _sse({"type": "complete", "success": False, "message": "Compile failed"}); return
                yield _sse({"type": "log", "level": "success", "message": "Compile OK"})

        yield _sse({"type": "step", "message": f"Running ONE ({n} run(s))…"})
        cmd = one_command(str(rel), is_batch, n)
        try:
            proc = subprocess.Popen(cmd, cwd=str(SIMULATOR_DIR),
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, bufsize=1)
            with _lock: _processes[str(proc.pid)] = proc
            for line in proc.stdout:
                line = line.rstrip()
                if line: yield _sse({"type": "log", "level": "output", "message": line})
            proc.wait()
            with _lock: _processes.pop(str(proc.pid), None)
            ok = proc.returncode == 0
            yield _sse({"type": "complete", "success": ok,
                         "message": f"Done ({n} runs)" if ok else f"Exit {proc.returncode}"})
        except Exception as e:
            yield _sse({"type": "complete", "success": False, "message": str(e)})

    if "text/event-stream" in request.headers.get("Accept", ""):
        return Response(stream_with_context(gen()), mimetype="text/event-stream",
                        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
    try:
        r = subprocess.run(one_command(str(rel), is_batch, n), cwd=str(SIMULATOR_DIR),
                           capture_output=True, text=True, timeout=300)
        if r.returncode != 0:
            return jsonify({"success": False, "error": r.stderr, "log": r.stdout}), 500
        return jsonify({"success": True, "log": r.stdout})
    except subprocess.TimeoutExpired:
        return jsonify({"success": False, "error": "Timed out (300s)"}), 504
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/results", methods=["GET"])
def results():
    if not REPORTS_DIR.exists():
        return jsonify({"error": "No reports folder."}), 404
    files = list(REPORTS_DIR.glob("*.txt"))
    if not files:
        return jsonify({"error": "No report files."}), 404
    out = {}
    for f in files:
        raw = f.read_text(encoding="utf-8", errors="replace")
        out[f.name] = {"raw": raw, "parsed": parse_report_file(raw)}
    return jsonify(out)


@app.route("/api/configs",      methods=["GET"])
def list_configs():
    return jsonify([f.name for f in CONFIGS_DIR.glob("*.txt")])

@app.route("/api/configs/<fn>", methods=["GET"])
def get_config(fn):
    p = CONFIGS_DIR / fn
    if not p.exists(): return jsonify({"error": "Not found"}), 404
    return jsonify({"content": p.read_text(encoding="utf-8")})

@app.route("/api/save-all",     methods=["POST"])
def save_all():
    s = (request.json or {}).get("settings", {})
    p = SIMULATOR_DIR / s.get("filename", "settings.txt")
    try:
        p.write_text(s.get("content", ""), encoding="utf-8")
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/terminate",    methods=["POST"])
def terminate():
    k = 0
    with _lock:
        for proc in _processes.values():
            try: proc.terminate(); k += 1
            except: pass
        _processes.clear()
    return jsonify({"success": True, "message": f"Terminated {k}"})


# Post-processing standalone endpoints

@app.route("/api/parse-to-csv", methods=["POST"])
def parse_to_csv():
    """
    Step 2 (legacy name kept): Run ReportAverager to produce averaged .txt files.

    Body params (optional):
      reports_dir  – path relative to SIMULATOR_DIR  (default: "reports/")
      output_dir   – ignored; averager writes into reports_dir automatically
    """
    body        = request.json or {}
    reports_dir = (SIMULATOR_DIR / body.get("reports_dir", "reports/")).resolve()
    if not reports_dir.exists():
        return jsonify({"success": False, "error": "reports_dir not found"}), 404
    batch_cfg = load_batch_config()
    result    = _run_averager_pipeline(reports_dir, batch_cfg)
    if "error" in result:
        return jsonify({"success": False, "error": result["error"]}), 500
    return jsonify({"success": True, "written": result})


@app.route("/api/run-averager", methods=["POST"])
def run_averager():
    """Step 3: Run ReportAverager → averaged .txt files."""
    body       = request.json or {}
    csv_dir    = (SIMULATOR_DIR / body.get("csv_dir", "reports/")).resolve()
    if not csv_dir.exists():
        return jsonify({"success": False, "error": "csv_dir not found"}), 404
    batch_cfg = load_batch_config()
    result    = _run_averager_pipeline(csv_dir, batch_cfg)
    if "error" in result:
        return jsonify({"success": False, "error": result["error"]}), 500
    return jsonify({"success": True, "results": result})


@app.route("/api/run-regression", methods=["POST"])
def run_regression():
    """Step 4: Generate all plots from averaged files via analysis.py."""
    body       = request.json or {}
    csv_dir    = (SIMULATOR_DIR / body.get("csv_dir",   "reports/")).resolve()
    plots_base = (SIMULATOR_DIR / body.get("plots_dir", "plots/")).resolve()
    if not csv_dir.exists():
        return jsonify({"success": False, "error": "csv_dir not found"}), 404
    analysis_cfg = load_analysis_config()
    if body.get("enabled_plots"):
        analysis_cfg["enabled_plots"].update(body["enabled_plots"])
    res = _run_analysis_plots(csv_dir, plots_base, analysis_cfg)
    if "error" in res:
        return jsonify({"success": False, "error": res["error"]}), 500
    res_out = {**res, "saved": [_rel(f) for f in res.get("saved", [])]}
    return jsonify({"success": True, "results": res_out})


# Full SSE pipeline

@app.route("/api/run-pipeline", methods=["POST"])
def run_pipeline():
    """
    Full SSE pipeline — 3 steps (plus optional compile):

      Step 1  Run ONE simulator (batch mode)
              → raw .txt files in reports/

      Step 2  Run ReportAverager
              → *_average.txt files in reports/

      Step 3  Generate plots via analysis.py
              → plots/<ReportType>/
    """
    data = request.json or {}

    if "filename" in data:
        cp = CONFIGS_DIR / data["filename"]
        if not cp.exists():
            return jsonify({"error": "Config not found"}), 404
    elif "config" in data:
        content = build_config_lines(data["config"])
        fn = f"user_config_{int(time.time()*1000)}.txt"; cp = CONFIGS_DIR / fn
        cp.write_text(content, encoding="utf-8")
    else:
        content  = data.get("content", "")
        fn       = data.get("settings_filename", f"user_config_{int(time.time()*1000)}.txt")
        cp       = CONFIGS_DIR / fn; cp.write_text(content, encoding="utf-8")

    rel        = cp.relative_to(SIMULATOR_DIR)
    n          = int(data.get("batch_count", 1)) or 1
    is_batch   = n > 1; do_compile = data.get("compile", False)

    reports_dir = (SIMULATOR_DIR / data.get("batchFolder",      "reports/")).resolve()
    plots_base  = (SIMULATOR_DIR / data.get("analysisPlotsDir", "plots/")).resolve()

    batch_cfg    = load_batch_config()
    analysis_cfg = load_analysis_config()
    if data.get("enabled_plots"):
        analysis_cfg["enabled_plots"].update(data["enabled_plots"])

    def generate():
        # Compile
        if do_compile:
            yield _sse({"type": "step", "step": 0, "message": "Compiling ONE…"})
            _compile_script = SIMULATOR_DIR / ("compile.bat" if is_windows() else "compile.sh")
            if not _compile_script.exists():
                yield _sse({"type": "log", "level": "warning",
                             "message": f"compile script not found at {_compile_script}, skipping."})
            else:
                r = subprocess.run(
                    (["bash", str(_compile_script)] if not is_windows() else [str(_compile_script)]),
                    cwd=str(SIMULATOR_DIR), capture_output=True, text=True, timeout=120)
                if r.returncode != 0:
                    yield _sse({"type": "log", "level": "error", "message": r.stderr[:500]})
                    yield _sse({"type": "pipeline_complete", "success": False,
                                 "message": "Compile failed"}); return
                yield _sse({"type": "log", "level": "success", "message": "Compile OK"})

        # Step 1: Simulation
        yield _sse({"type": "step", "step": 1,
                    "message": f"Running ONE simulator — {n} batch run(s)…"})
        cmd = one_command(str(rel), is_batch, n)
        try:
            proc = subprocess.Popen(cmd, cwd=str(SIMULATOR_DIR),
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, bufsize=1)
            with _lock: _processes[str(proc.pid)] = proc
            for line in proc.stdout:
                line = line.rstrip()
                if line: yield _sse({"type": "log", "level": "output", "message": line})
            proc.wait()
            with _lock: _processes.pop(str(proc.pid), None)
            if proc.returncode != 0:
                yield _sse({"type": "pipeline_complete", "success": False,
                             "message": f" Simulation exit {proc.returncode}"}); return
        except Exception as e:
            yield _sse({"type": "pipeline_complete", "success": False, "message": str(e)}); return
        yield _sse({"type": "log", "level": "success",
                    "message": f" Simulation done — {n} run(s)"})

        # Step 2: Run ReportAverager
        yield _sse({"type": "step", "step": 2,
                    "message": " Running ReportAverager → averaged .txt files…"})

        grp = batch_cfg.get("average_groups", [])
        group_names = [g.get("name", "?") for g in grp]
        yield _sse({"type": "log", "level": "output",
                    "message": f" Averaging groups: {group_names}"})

        avg_result = _run_averager_pipeline(reports_dir, batch_cfg)

        if "error" in avg_result:
            yield _sse({"type": "log", "level": "error",
                         "message": f"  ⚠ Averager error: {avg_result['error']}"})
        else:
            for f in avg_result.get("output_files", []):
                yield _sse({"type": "log", "level": "success",
                             "message": f" {Path(f).name}"})
                yield _sse({"type": "log", "level": "output",
                             "message": f"     → {_rel(f)}"})
            yield _sse({"type": "log", "level": "success",
                         "message": f" {avg_result['processed']} averaged file(s) created"})

        # Step 3: Generate plots via analysis.py
        yield _sse({"type": "step", "step": 3,
                    "message": "Generating plots (line, violin, heatmap, pairplot)…"})

        yield _sse({"type": "log", "level": "output",
                    "message": f"  [Plots] Running analysis.py pipeline → {_rel(str(plots_base))}"})

        res = _run_analysis_plots(reports_dir, plots_base, analysis_cfg)

        all_saved:    list = []
        plot_results: dict = {}

        if "error" in res:
            yield _sse({"type": "log", "level": "error",
                         "message": f"  ⚠ Plot generation error: {res['error']}"})
        elif "warning" in res:
            yield _sse({"type": "log", "level": "warning",
                         "message": f"  ⚠ {res['warning']}"})
        else:
            all_saved = res["saved"]
            for rt, paths in res.get("by_type", {}).items():
                rel_paths = [_rel(p) for p in paths]
                plot_results[rt] = {"total": len(rel_paths), "saved": rel_paths}
                yield _sse({"type": "log", "level": "success",
                             "message": f"{len(rel_paths)} plot(s) for {rt}"})
                for rp in rel_paths:
                    yield _sse({"type": "log", "level": "output",
                                 "message": f"    🖼 {rp}"})
            yield _sse({"type": "log", "level": "success",
                         "message": f"{res['total']} total plot(s) generated"})

        yield _sse({"type": "log", "level": "success",
                    "message": f"Pipeline complete — {len(all_saved)} total file(s)"})

        try:   pb_rel = str(plots_base.relative_to(SIMULATOR_DIR))
        except: pb_rel = str(plots_base)

        raw_results: dict = {}
        for f in reports_dir.glob("*.txt"):
            raw = f.read_text(encoding="utf-8", errors="replace")
            raw_results[f.name] = {"raw": raw, "parsed": parse_report_file(raw)}

        avg_files = [str(p) for p in reports_dir.glob("*_average.txt")]

        yield _sse({
            "type": "pipeline_complete", "success": True,
            "message": "Full pipeline complete",
            "data": {
                "avg_files":    [_rel(f) for f in avg_files],
                "plot_results": plot_results,
                "plots_base":   pb_rel,
                "grand_saved":  [_rel(f) for f in all_saved],
                "raw_results":  raw_results,
            },
        })

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.route("/api/get-plot")
def get_plot():
    rel_path = request.args.get("path", "")
    if not rel_path:
        abort(400)
    safe_path = os.path.normpath(rel_path)
    if safe_path.startswith(".."):
        abort(400)
    full_path = SIMULATOR_DIR / safe_path
    print("Full path img: ", full_path)
    if not full_path.is_file():
        abort(404)
    return send_file(str(full_path))


# Compatibility stubs
@app.route("/api/run-one",       methods=["POST"])
def run_one(): return run_simulation()

@app.route("/api/run-analysis",  methods=["POST"])
def run_analysis(): return run_regression()

@app.route("/api/save-configs",  methods=["POST"])
def save_configs(): return jsonify({"success": True})

@app.route("/api/wkt/test_city", methods=["POST"])
def wkt_test_city():
    city = (request.json or {}).get("city_name", "")
    if not city: return jsonify({"available": False, "message": "No city name"}), 400
    return jsonify({"available": True, "message": f"'{city}' looks valid."})


# Entry point 
if __name__ == "__main__":
    bc = load_batch_config()
    ac = load_analysis_config()

    print(f"\n{'='*65}")
    print(f"  ONE Simulator Flask API  —  Averager + Analysis Pipeline")
    print(f"{'='*65}")
    print(f"  Simulator dir   : {SIMULATOR_DIR}")
    print(f"  batch_config    : {'✓' if BATCH_CFG_PATH.exists() else '✗ MISSING (using defaults)'}")
    print(f"  analysis_config : {'✓' if ANALYSIS_CFG_PATH.exists() else '✗ MISSING (using defaults)'}")
    print()
    print("  Pipeline steps:")
    print("    Step 1  →  ONE simulation  (batch mode)")
    print("    Step 2  →  ReportAverager  → *_average.txt in reports/")
    print("    Step 3  →  analysis.py     → plots/<ReportType>/")
    print()
    print("  Averaging groups:")
    for grp in bc.get("average_groups", []):
        print(f"    • {grp.get('name','?')}  group_by={grp.get('group_by','?')}  "
              f"min_files={grp.get('min_files',2)}")
    print()
    print("  Plot types enabled:")
    for pt, en in ac.get("enabled_plots", {}).items():
        print(f"    {'✓' if en else '✗'} {pt}")
    print()
    print("  Report type → metrics:")
    for rt, mlist in REPORT_METRICS.items():
        print(f"\n  [{rt}]")
        for m in mlist:
            print(f"    • {m:40s}  {METRIC_LABELS.get(m,'')}")
    print(f"\n{'='*65}")
    print(f"  Running on : http://localhost:4000")
    print(f"{'='*65}\n")
    app.run(host="0.0.0.0", port=4000, debug=False, threaded=True)
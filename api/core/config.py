import os, re, json
from pathlib import Path

from constants import GLOBAL_IGNORE


DEFAULT_BATCH_CFG: dict = {
    "data_separator": ":",
    "ignore_fields":  list(GLOBAL_IGNORE),
    "min_seeds":      1,
    "output":         {"precision": 4},
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
    "report_types": ["MessageStatsReport", "CCNApplicationReport"],
}

DEFAULT_ANALYSIS_CFG: dict = {
    "data_separator": ":",
    "directories":    {"report_dir": "reports/", "plots_dir": "plots/"},
    "file_patterns":  {"report_extension": ".txt"},
    "report_types":   ["MessageStatsReport", "CCNApplicationReport"],
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
            "delivery_prob",
            "overhead_ratio",
            "latency_avg",
            "hopcount_avg",
            "buffertime_avg",
            "oppo_cache_hit",
            "oppo_cache_miss",
            "drop_list",
            "drop_pit",
            "drop_nonce",
            "query_count",
            "duplicated_query",
            "static_cache_hit",
            "static_cache_miss",
            "response_count",
            "average_interval",
            "caching_gain_index",
            "retrieval_latency_reduction",
            "interest_satisfaction_rate",
            "dissemination_efficiency"
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
        "general":      {"dpi": 150},
        "line_plots":   {
            "size": [10, 6], "marker_size": 10,
            "markers": ["o", "s", "^", "D", "v", "*", "P", "X"],
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


def _load_json(path: Path) -> dict:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as e:
        print(f"  [config] {path.name} invalid JSON: {e}")
        return {}


def load_batch_config(BATCH_CFG_PATH: Path) -> dict:
    import copy
    cfg = copy.deepcopy(DEFAULT_BATCH_CFG)
    cfg["ignore_fields"] = list(GLOBAL_IGNORE)
    cfg.update(_load_json(BATCH_CFG_PATH))
    return cfg


def load_analysis_config(ANALYSIS_CFG_PATH: Path) -> dict:
    import copy
    cfg = copy.deepcopy(DEFAULT_ANALYSIS_CFG)
    cfg["grouping_labels"] = dict(GROUPING_LABELS)
    cfg["plots_dir"] = "plots"
    for k, v in _load_json(ANALYSIS_CFG_PATH).items():
        cfg[k] = v
    return cfg


def _sse(d: dict) -> str:
    return f"data: {json.dumps(d)}\n\n"


def is_windows() -> bool:
    return os.name == "nt"


def one_command(cfg_rel: str, batch: bool, n: int, SIMULATOR_DIR: Path) -> list:
    script_name = "one.bat" if is_windows() else "one.sh"
    s = str(SIMULATOR_DIR / script_name)
    return [s, "-b", str(n), cfg_rel] if batch else [s, cfg_rel]


def build_config_lines(config: dict) -> str:
    sections = {
        "Scenario": [], "Interface": [], "Group": [], "MovementModel": [],
        "MapBasedMovement": [], "Source": [], "Sink": [], "Seeder": [],
        "Report": [], "Events": [], "Optimization": [], "GUI": [], "Other": [],
    }
    order = list(sections.keys())
    for key, value in config.items():
        prefix = re.sub(r"\d+$", "", key.split(".")[0])
        bucket = next((s for s in order if prefix.lower().startswith(s.lower())), "Other")
        sections[bucket].append(f"{key} = {value}")
    lines = []
    for sec, entries in sections.items():
        if not entries:
            continue
        lines.append(f"## {sec} settings")
        lines.extend(entries)
        lines.append("")
    return "\n".join(lines)


def parse_report_file(content: str) -> dict:
    stats = {}
    raw = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        for sep in (":", "="):
            if sep in line:
                k, v = line.split(sep, 1)
                if k.strip():
                    stats[k.strip()] = v.strip()
                break
        else:
            raw.append(line)
    return {"stats": stats, "raw_lines": raw}


def _rel(p: str, SIMULATOR_DIR: Path) -> str:
    try:
        return str(Path(p).relative_to(SIMULATOR_DIR))
    except Exception:
        return p
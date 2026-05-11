import os, re, threading, sys
from pathlib import Path
from collections import defaultdict

_APP_DIR = Path(__file__).resolve().parent
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))


import numpy as np
import pandas as pd
 
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
 
from flask import Flask
from flask_cors import CORS
 

from constants import REPORT_METRICS, METRIC_LABELS
from config import (
    load_batch_config as _load_batch_config_impl,
    load_analysis_config as _load_analysis_config_impl,
    one_command as _one_command_impl,
    _rel as _rel_impl,
)
 
 
app  = Flask(__name__)
CORS(app)

BASE_DIR      = Path(__file__).parent.parent.parent
SIMULATOR_DIR = BASE_DIR / "simulator"
REPORTS_DIR   = SIMULATOR_DIR / "reports"
CONFIGS_DIR   = SIMULATOR_DIR / "user_configs"
CONFIGS_DIR.mkdir(parents=True, exist_ok=True)

_API_DIR          = Path(__file__).parent.parent
CONFIG_DIR        = _API_DIR / "config"
BATCH_CFG_PATH    = CONFIG_DIR / "averager_config.json"
ANALYSIS_CFG_PATH = CONFIG_DIR / "analysis_config.json"

_processes: dict = {}
_lock = threading.Lock()

def load_batch_config() -> dict:
    return _load_batch_config_impl(BATCH_CFG_PATH)

def load_analysis_config() -> dict:
    return _load_analysis_config_impl(ANALYSIS_CFG_PATH)

def one_command(cfg_rel: str, batch: bool, n: int = 1) -> list:
    return _one_command_impl(cfg_rel, batch, n, SIMULATOR_DIR)

def _rel(p: str) -> str:
    return _rel_impl(p, SIMULATOR_DIR)


from routes import register_routes
register_routes(
    app,
    ctx={
        "SIMULATOR_DIR":     SIMULATOR_DIR,
        "REPORTS_DIR":       REPORTS_DIR,
        "CONFIGS_DIR":       CONFIGS_DIR,
        "BATCH_CFG_PATH":    BATCH_CFG_PATH,
        "ANALYSIS_CFG_PATH": ANALYSIS_CFG_PATH,
        "_processes":        _processes,
        "_lock":             _lock,
    }, 
)


if __name__ == "__main__":
    bc = load_batch_config()
    ac = load_analysis_config()

    print(f"\n{'='*65}")
    print(f"  ONE Simulator Flask API  —  Averager + Analysis Pipeline")
    print(f"{'='*65}")
    print(f"  Simulator dir   : {SIMULATOR_DIR}")
    print(f"  Batch cfg       : {BATCH_CFG_PATH}")
    print(f"  Reports dir     : {REPORTS_DIR}")
    print(f"  batch_config    : {'✓' if BATCH_CFG_PATH.exists() else '✗ MISSING (using defaults)'}")
    print(f"  analysis_config : {'✓' if ANALYSIS_CFG_PATH.exists() else '✗ MISSING (using defaults)'}")
    print()
    print("  Pipeline: Step 1 → ONE simulation | Step 2 → ReportAverager | Step 3 → analysis.py plots")
    print()
    print("  Averaging groups:")
    for grp in bc.get("average_groups", []):
        print(f"    • {grp.get('name','?')}  group_by={grp.get('group_by','?')}  min_files={grp.get('min_files',2)}")
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

    app.run(host="0.0.0.0", port=4000, debug=True, use_reloader=False, threaded=True)
    
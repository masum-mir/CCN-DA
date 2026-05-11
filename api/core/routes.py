import os, subprocess, time, json, tempfile, copy, threading
from pathlib import Path
from multiprocessing import Pool

from flask import request, jsonify, Response, stream_with_context, send_file, abort

from config import (
    _sse, is_windows, parse_report_file, load_batch_config, load_analysis_config,
    DEFAULT_BATCH_CFG, DEFAULT_ANALYSIS_CFG,
)
from averager import ReportAverager
from analysis import (
    SmartFileParser, DataOrganizer, PlotStrategy,
    execute_plot_job, _init_worker,
)
import traceback as _traceback


def _run_averager_pipeline(reports_dir: Path, batch_cfg: dict) -> dict:
    cfg = copy.deepcopy(DEFAULT_BATCH_CFG)
    cfg.update(batch_cfg)
    cfg["folder"] = str(reports_dir) + "/"

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as tf:
        json.dump(cfg, tf)
        tmp_path = tf.name

    try:
        averager = ReportAverager(tmp_path, safety_enabled=True)
        averager.run()
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
    cfg = copy.deepcopy(DEFAULT_ANALYSIS_CFG)
    for k, v in analysis_cfg.items():
        if isinstance(v, dict) and isinstance(cfg.get(k), dict):
            cfg[k].update(v)
        else:
            cfg[k] = v

    cfg["directories"]["report_dir"] = str(reports_dir)
    cfg["directories"]["plots_dir"]  = str(plots_base)

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
            return ps.get(key) or ps.get(key + "_plots") or ps.get(key.replace("_plots", "")) or {}

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

        if cfg["enabled_plots"].get("heatmaps", True) and raw_df is not None and "router" in raw_df.columns:
            for router in raw_df["router"].unique():
                router_df = raw_df[raw_df["router"] == router]
                plot_jobs.append(("heatmap", (router, router_df, cfg["metrics"]["include"], str(plots_base), heatmap_cfg)))

        if cfg["enabled_plots"].get("pairplot", True) and raw_df is not None:
            plot_jobs.append(("pairplot", (raw_df, cfg["metrics"]["include"], str(plots_base), pair_cfg)))

        if not plot_jobs:
            return {"total": 0, "saved": [], "by_type": {}, "warning": "No plot jobs generated — check averaged files."}

        num_workers = min(max(1, (os.cpu_count() or 2) // 2), len(plot_jobs), 4)
        with Pool(processes=num_workers, initializer=_init_worker, initargs=(cfg, str(plots_base))) as pool:
            pool.map(execute_plot_job, plot_jobs)

        saved = [str(p) for p in sorted(plots_base.rglob("*.png"))]
        by_type: dict = {}
        for p in saved:
            rel = Path(p).relative_to(plots_base)
            rt  = rel.parts[0] if len(rel.parts) > 1 else "plots"
            by_type.setdefault(rt, []).append(p)

        return {"total": len(saved), "saved": saved, "by_type": by_type}

    except Exception as exc:
        _traceback.print_exc()
        return {"error": str(exc), "total": 0, "saved": [], "by_type": {}}


def register_routes(app, ctx: dict):
    SIMULATOR_DIR     = ctx["SIMULATOR_DIR"]
    REPORTS_DIR       = ctx["REPORTS_DIR"]
    BATCH_CFG_PATH    = ctx["BATCH_CFG_PATH"]
    ANALYSIS_CFG_PATH = ctx["ANALYSIS_CFG_PATH"]
    _processes        = ctx["_processes"]
    _lock             = ctx["_lock"]

    def _load_batch():    return load_batch_config(BATCH_CFG_PATH)
    def _load_analysis(): return load_analysis_config(ANALYSIS_CFG_PATH)

    def _rel(p):
        try:   return str(Path(p).relative_to(SIMULATOR_DIR))
        except: return p

    def _one_command(cfg_rel, batch, n=1):
        s = str(SIMULATOR_DIR / ("one.bat" if is_windows() else "one.sh"))
        return [s, "-b", str(n), cfg_rel] if batch else [s, cfg_rel]

    @app.route("/api/terminate", methods=["POST"])
    def terminate():
        k = 0
        with _lock:
            for proc in _processes.values():
                try: proc.terminate(); k += 1
                except: pass
            _processes.clear()
        return jsonify({"success": True, "message": f"Terminated {k}"})

    @app.route("/api/generate-reports", methods=["POST"])
    def generate_reports():
        data       = request.json or {}
        content    = data.get("content", "")
        fn         = data.get("settings_filename")
        if not fn:
            return jsonify({"error": "settings_filename is required"}), 400

        n          = max(1, int(data.get("batch_count", 1)))
        is_batch   = n > 1
        do_compile = bool(data.get("compile", False))

        (SIMULATOR_DIR / fn).write_text(content, encoding="utf-8")

        import queue
        log_queue = queue.Queue()

        def run_simulation():
            def push(d):
                log_queue.put(_sse(d))

            if do_compile:
                push({"type": "log", "level": "info", "message": "Compiling ONE…"})
                compile_script = SIMULATOR_DIR / ("compile.bat" if is_windows() else "compile.sh")
                if not compile_script.exists():
                    push({"type": "log", "level": "warning", "message": "compile script not found, skipping."})
                else:
                    r = subprocess.run(
                        (["bash", str(compile_script)] if not is_windows() else [str(compile_script)]),
                        cwd=str(SIMULATOR_DIR), capture_output=True, text=True, timeout=120,
                    )
                    if r.returncode != 0:
                        push({"type": "log", "level": "error", "message": r.stderr[:500]})
                        push({"type": "complete", "success": False, "message": "Compile failed"})
                        log_queue.put(None)  # sentinel
                        return
                    push({"type": "log", "level": "success", "message": "Compile OK"})

            push({"type": "log", "level": "info", "message": f"Starting ONE — {n} run(s) — {fn}"})

            try:
                proc = subprocess.Popen(
                    _one_command(fn, is_batch, n),
                    cwd=str(SIMULATOR_DIR),
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    text=True, bufsize=1,
                )
                with _lock:
                    _processes[str(proc.pid)] = proc

                for line in proc.stdout:
                    line = line.rstrip()
                    if line:
                        push({"type": "log", "level": "output", "message": line})

                proc.wait()
                with _lock:
                    _processes.pop(str(proc.pid), None)

                if proc.returncode != 0:
                    push({"type": "complete", "success": False, "message": f"ONE exited with code {proc.returncode}"})
                else:
                    push({"type": "complete", "success": True, "message": f"Simulation done — {n} run(s)"})

            except Exception as exc:
                push({"type": "complete", "success": False, "message": str(exc)})

            finally:
                log_queue.put(None)  # sentinel — thread শেষ

        # Simulation আলাদা thread-এ চলবে, Flask thread free থাকবে
        thread = threading.Thread(target=run_simulation, daemon=True)
        thread.start()

        def generate():
            while True:
                item = log_queue.get()
                if item is None:  # sentinel = শেষ
                    break
                yield item

        return Response(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    @app.route("/api/run-averager", methods=["POST"])
    def run_averager():
        batch_cfg   = _load_batch()
        reports_dir = (SIMULATOR_DIR / batch_cfg.get("folder", "reports/")).resolve()

        if not reports_dir.exists():
            return jsonify({"success": False, "message": f"Reports folder not found: {reports_dir}"}), 404

        result = _run_averager_pipeline(reports_dir, batch_cfg)

        if "error" in result:
            return jsonify({"success": False, "message": result["error"]}), 500

        return jsonify({
            "success": True,
            "message": f"{result['processed']} averaged file(s) created",
            "averaged": {
                "processed":    result["processed"],
                "output_files": [_rel(f) for f in result.get("output_files", [])],
            },
        })

    @app.route("/api/run-regression", methods=["POST"])
    def run_regression():
        analysis_cfg = _load_analysis()
        reports_dir  = (SIMULATOR_DIR / analysis_cfg.get("directories", {}).get("report_dir", "reports/")).resolve()
        plots_base   = (SIMULATOR_DIR / analysis_cfg.get("directories", {}).get("plots_dir",  "plots/")).resolve()

        if not reports_dir.exists():
            return jsonify({"success": False, "message": f"Reports folder not found: {reports_dir}"}), 404

        res = _run_analysis_plots(reports_dir, plots_base, analysis_cfg)

        if "error" in res:
            return jsonify({"success": False, "message": res["error"]}), 500

        plot_results = {}
        for rt, paths in res.get("by_type", {}).items():
            rel_paths = [_rel(p) for p in paths]
            plot_results[rt] = {"total": len(rel_paths), "saved": rel_paths}

        try:   pb_rel = str(plots_base.relative_to(SIMULATOR_DIR))
        except: pb_rel = str(plots_base)

        return jsonify({
            "success":      True,
            "message":      f"{res.get('total', 0)} plot(s) generated",
            "plot_results": plot_results,
            "plots_base":   pb_rel,
            "regression":   {},
            "analysis":     {"total_plots": res.get("total", 0), "by_type": {k: v["total"] for k, v in plot_results.items()}},
        })

    @app.route("/api/get-plot")
    def get_plot():
        rel_path  = request.args.get("path", "")
        safe_path = os.path.normpath(rel_path)
        if not rel_path or safe_path.startswith(".."):
            abort(400)
        full_path = SIMULATOR_DIR / safe_path
        if not full_path.is_file():
            abort(404)
        return send_file(str(full_path))

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
REPORT_METRICS: dict = {
    "MessageStatsReport": [
        "created", "started", "relayed", "dropped",
        "delivery_prob", "overhead_ratio",
        "latency_avg", "latency_med",
        "hopcount_avg", "hopcount_med",
        "buffertime_avg", "buffertime_med",
    ],
    "CCNApplicationReport": [
        "query_count", "response_count", "interest_satisfaction_rate",
        "static_cache_hit", "static_cache_miss",
        "oppo_cache_hit", "oppo_cache_miss",
        "drop_pit", "drop_nonce", "drop_list",
        "duplicated_query", "average_interval",
        "retrieval_latency_reduction", "caching_gain_index", "dissemination_efficiency"
    ],
}

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
    "interest_satisfaction_rate":  "Interest Satisfaction Rate",
    "dissemination_efficiency":     "Dissemination Efficiency"

}

COLORS:  list = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f"]
MARKERS: list = ["o", "s", "^", "D", "v", "P", "X", "*"]

GLOBAL_IGNORE: set = {"sim_time"}
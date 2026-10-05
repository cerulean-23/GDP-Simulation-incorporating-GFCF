"""
Regenerate the bundled default FRED result used by the "Load thesis result"
button: frontend/src/data/fredDefault.json.

Run from backend/:
    uv run python scripts/precompute_fred_default.py
    uv run python scripts/precompute_fred_default.py --out some/other/path.json

It drives the real WebSocket path with the default settings, so the snapshot
is exactly what a live run on the FRED page produces (Differential Evolution
is seeded with 42 in rolling_de.py, so it is reproducible). It refuses to
write the file if the metrics drift from the thesis notebook.
"""

import argparse
import json
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import scipy
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.main import app  # noqa: E402

DEFAULT_OUT = Path(__file__).resolve().parents[2] / "frontend" / "src" / "data" / "fredDefault.json"

# Same notebook reference + tolerances as verify_fred.py
NOTEBOOK = {"fitting": 0.4407, "forecast": 0.9040, "overall": 0.5866, "naive": 1.3778}
TOL = {"fitting": 0.03, "forecast": 0.15, "overall": 0.05, "naive": 0.001}

parser = argparse.ArgumentParser()
parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
args = parser.parse_args()

client = TestClient(app)

meta = client.get("/api/fred/datasets").json()
dataset_id = meta["defaults"]["dataset_id"]
dataset = client.get(f"/api/fred/data/{dataset_id}").json()

print(f"Running default FRED simulation for {dataset_id} (about 30-120 s)...")
with client.websocket_connect("/ws/fred/precompute") as ws:
    ws.send_json({"dataset_id": dataset_id})  # everything else = server defaults
    while True:
        msg = ws.receive_json()
        if msg["type"] == "error":
            sys.exit(f"ERROR: {msg['message']}")
        if msg["type"] == "done":
            result = msg["result"]
            break

cfg = result["fred"]["config"]
d = meta["defaults"]
assert cfg["window"] == d["window"] and cfg["population_size"] == d["population_size"], "config is not the default"

m = result["fred"]["metrics"]
got = {
    "fitting": m["fitting"]["mape"],
    "forecast": m["forecast"]["mape"],
    "overall": m["overall"]["mape"],
    "naive": m["overall"]["naive_mape"],
}
ok = True
for k, ref in NOTEBOOK.items():
    good = abs(got[k] - ref) <= TOL[k]
    ok &= good
    print(f"  {k:<9} notebook {ref:.4f}  app {got[k]:.4f}  {'OK' if good else 'OUT OF TOLERANCE'}")
if not ok:
    sys.exit("Metrics drifted from the notebook; snapshot NOT written.")

payload = {
    "snapshot": {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "seed": 42,
        "python": platform.python_version(),
        "numpy": np.__version__,
        "scipy": scipy.__version__,
        "note": "Default settings, produced by this application's own backend (rolling_de.py).",
    },
    "meta": meta,
    "dataset": dataset,
    "result": result,
}
args.out.parent.mkdir(parents=True, exist_ok=True)
args.out.write_text(json.dumps(payload, separators=(",", ":"), allow_nan=False), encoding="utf-8")
print(f"Wrote {args.out} ({args.out.stat().st_size / 1024:.1f} KB)")

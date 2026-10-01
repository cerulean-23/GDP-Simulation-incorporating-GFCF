"""
End-to-end check of the FRED pipeline against the thesis notebook numbers.

Run from backend/:   uv run python scripts/verify_fred.py
Runs the real WebSocket path with default settings (window 20, popsize 20,
1000 iterations, 80/20 split) and prints the metrics next to the notebook's.

Differential Evolution is stochastic: the notebook has no seed, the app uses
seed=42. So phase MAPEs are compared with a tolerance, while the naive
baseline (fully deterministic) must match tightly.
"""

import sys
import time
from pathlib import Path

# make `app` importable when run as `python scripts/verify_fred.py` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import router

NOTEBOOK = {"fitting": 0.4407, "forecast": 0.9040, "overall": 0.5866, "naive": 1.3778}
TOL = {"fitting": 0.03, "forecast": 0.15, "overall": 0.05, "naive": 0.001}

app = FastAPI()
app.include_router(router)
client = TestClient(app)

t0 = time.time()
with client.websocket_connect("/ws/fred/verify") as ws:
    ws.send_json({"dataset_id": "IDN"})
    while True:
        msg = ws.receive_json()
        if msg["type"] == "error":
            sys.exit(f"ERROR: {msg['message']}")
        if msg["type"] == "done":
            res = msg["result"]
            break

m = res["fred"]["metrics"]
got = {
    "fitting": m["fitting"]["mape"],
    "forecast": m["forecast"]["mape"],
    "overall": m["overall"]["mape"],
    "naive": m["overall"]["naive_mape"],
}
print(f"Run time: {time.time() - t0:.1f}s | split index {m['split_index']} "
      f"({res['fred']['period_labels'][m['split_index']]}) | n fit/forecast: {m['fitting']['n']}/{m['forecast']['n']}")
print(f"{'metric':<10}{'notebook':>10}{'app':>10}{'diff':>9}  status")
ok = True
for k in NOTEBOOK:
    diff = got[k] - NOTEBOOK[k]
    good = abs(diff) <= TOL[k]
    ok &= good
    print(f"{k:<10}{NOTEBOOK[k]:>10.4f}{got[k]:>10.4f}{diff:>+9.4f}  {'OK' if good else 'OUT OF TOLERANCE'}")
print("RESULT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)

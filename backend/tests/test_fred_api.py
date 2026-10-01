"""
Tests for the bundled-FRED endpoints. Run from backend/:  uv run python -m pytest tests/test_fred_api.py -q
WebSocket runs use tiny DE settings so the suite stays fast; the full
notebook-equivalent run is checked by scripts/verify_fred.py.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

FAST = {"dataset_id": "IDN", "population_size": 5, "max_iterations": 20, "window": 20}


def run_ws(payload):
    msgs = []
    with client.websocket_connect("/ws/fred/test-session") as ws:
        ws.send_json(payload)
        while True:
            msg = ws.receive_json()
            msgs.append(msg)
            if msg["type"] in ("done", "error"):
                return msgs


def test_datasets_endpoint():
    r = client.get("/api/fred/datasets")
    assert r.status_code == 200
    body = r.json()
    ds = body["datasets"][0]
    assert ds["id"] == "IDN" and ds["n_obs"] == 105
    assert (ds["start"], ds["end"]) == ("2000Q1", "2026Q1")
    assert body["defaults"]["window"] == 20 and body["defaults"]["split_ratio"] == 0.8
    assert body["scale"] == 1_000_000.0


def test_data_endpoint_and_unknown_dataset():
    r = client.get("/api/fred/data/IDN")
    assert r.status_code == 200
    d = r.json()
    assert len(d["gdp"]) == len(d["gfcf"]) == len(d["period_labels"]) == len(d["dates"]) == 105
    assert d["period_labels"][0] == "2000Q1" and d["period_labels"][-1] == "2026Q1"
    assert d["gdp"][0] == pytest.approx(1012908548.9)
    r = client.get("/api/fred/data/XXX")
    assert r.status_code == 404 and "Unknown FRED dataset" in r.json()["detail"]


def test_ws_run_shape_and_phases():
    msgs = run_ws(FAST)
    assert msgs[-1]["type"] == "done", msgs[-1]
    progress = [m for m in msgs if m["type"] == "progress"]
    assert len(progress) == 85 and progress[0]["period"] == "2005Q1" and progress[-1]["period"] == "2026Q1"
    res = msgs[-1]["result"]
    for key in ("years", "y_actual", "y_pred", "a_track", "b_track", "c_track", "sse_per_year",
                "mape_overall", "mae_overall", "r2_overall", "best_sse_final", "fred"):
        assert key in res
    assert res["y_pred"][:20] == [None] * 20 and all(v is not None for v in res["y_pred"][20:])
    m = res["fred"]["metrics"]
    assert m["split_index"] == 84 and m["first_prediction_index"] == 20
    assert (m["fitting"]["n"], m["forecast"]["n"], m["overall"]["n"]) == (64, 21, 85)
    assert m["overall"]["mape"] == pytest.approx(res["mape_overall"])
    assert res["fred"]["period_labels"][84] == "2021Q1"


@pytest.mark.parametrize(
    "patch, fragment",
    [
        ({"dataset_id": "NOPE"}, "Unknown FRED dataset"),
        ({"population_size": 4}, "Population size"),
        ({"population_size": 101}, "Population size"),
        ({"population_size": 10.5}, "whole number"),
        ({"max_iterations": 0}, "Max iterations"),
        ({"window": 3}, "Rolling window"),
        ({"window": 80}, "Rolling window"),
        ({"split_ratio": 0.99}, "Split ratio"),
        ({"bounds": {"a": [0.5, -0.5]}}, "lower bound"),
        ({"bounds": {"b": [0, 5]}}, "within"),
        ({"bounds": {"c": "bad"}}, "bounds must be"),
        ({"bounds": [1, 2]}, "bounds must be an object"),
    ],
)
def test_ws_rejects_invalid_config(patch, fragment):
    msgs = run_ws({**FAST, **patch})
    assert msgs[-1]["type"] == "error"
    assert fragment in msgs[-1]["message"]
    assert not [m for m in msgs if m["type"] == "progress"]


def test_ws_rejects_non_object_payload():
    msgs = run_ws([1, 2, 3])
    assert msgs[-1]["type"] == "error" and "JSON object" in msgs[-1]["message"]


def test_existing_routes_unaffected():
    assert client.get("/api/results/nope").json() == {"cached": False}
    assert client.get("/api/seed-mape").status_code == 200

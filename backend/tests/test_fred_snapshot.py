"""
Guards the bundled default result (frontend/src/data/fredDefault.json) against
going stale: if the CSV data, the default config, or the dataset metadata
change, this fails until scripts/precompute_fred_default.py is re-run.
"""

import json
from pathlib import Path

import pytest

from app.api.routes_fred import FRED_DEFAULTS
from app.data.fred_loader import load_fred_dataset

SNAP = Path(__file__).resolve().parents[2] / "frontend" / "src" / "data" / "fredDefault.json"


@pytest.fixture(scope="module")
def snap():
    if not SNAP.exists():
        pytest.skip("fredDefault.json not generated yet (run scripts/precompute_fred_default.py)")
    return json.loads(SNAP.read_text(encoding="utf-8"))


def test_snapshot_matches_current_data(snap):
    live = load_fred_dataset(snap["dataset"]["meta"]["id"])
    assert snap["dataset"]["period_labels"] == live["period_labels"]
    assert snap["dataset"]["gdp"] == live["gdp"]
    assert snap["dataset"]["gfcf"] == live["gfcf"]


def test_snapshot_uses_current_defaults(snap):
    assert snap["meta"]["defaults"] == FRED_DEFAULTS
    cfg = snap["result"]["fred"]["config"]
    for key in ("bounds", "population_size", "max_iterations", "window", "split_ratio"):
        assert cfg[key] == FRED_DEFAULTS[key]


def test_snapshot_result_is_well_formed(snap):
    r = snap["result"]
    n = len(snap["dataset"]["gdp"])
    assert len(r["y_actual"]) == len(r["y_pred"]) == len(r["a_track"]) == len(r["sse_per_year"]) == n
    m = r["fred"]["metrics"]
    assert (m["split_index"], m["first_prediction_index"]) == (84, 20)
    assert r["y_actual"] == snap["dataset"]["gdp"]
    assert m["overall"]["mape"] == pytest.approx(r["mape_overall"])

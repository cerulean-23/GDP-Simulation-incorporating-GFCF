"""
In-memory cache keyed by session_id, so simulation results survive
navigation between Simulation and Metrics pages without recomputation.
No login/auth, no DB — matches the non-functional requirement.

For a skripsi demo this is fine. If the process restarts, cache clears —
acceptable given the "no security protocol" scope decision.
"""

from typing import Any

_cache: dict[str, dict[str, Any]] = {}


def get(session_id: str) -> dict[str, Any] | None:
    return _cache.get(session_id)


def set(session_id: str, data: dict[str, Any]) -> None:
    _cache[session_id] = data


def clear(session_id: str) -> None:
    _cache.pop(session_id, None)

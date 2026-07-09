"""
Standalone smoke test for the Phase 4.2 LangGraph pipeline.

Runs the compiled graph end-to-end with a seeded AgentState and verifies that
every node returns populated, strongly-typed state instead of empty objects.

This file is intentionally standalone: it does NOT import or modify any REST
endpoint, and it does NOT change graph topology or node code. It only *invokes*
the already-compiled `graph`.

Usage (from the backend/ directory, with the backend venv active):

    python smoke_test_langgraph.py
    python smoke_test_langgraph.py --lat 19.0760 --lng 72.8777 -q "Is it safe to stay?"

Exit code 0 = all checks passed, 1 = at least one node returned empty state,
2 = the graph raised (pipeline crashed).
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from app.langgraph.graph import graph
from app.langgraph.state import AgentState
from app.langgraph.models import LocationState


# Default: central Bangalore (matches the state bounding boxes in alert.py).
DEFAULT_LAT = 12.9716
DEFAULT_LNG = 77.5946
DEFAULT_QUESTION = "Where is the safest place for me to go right now?"


def _as_state(result) -> AgentState:
    """LangGraph may return the state schema instance or a plain dict."""
    if isinstance(result, AgentState):
        return result
    if isinstance(result, dict):
        return AgentState(**result)
    # Fallback: some versions return a Pydantic-like object with .model_dump()
    if hasattr(result, "model_dump"):
        return AgentState(**result.model_dump())
    raise TypeError(f"Unexpected graph output type: {type(result)!r}")


def _check(label: str, ok: bool, detail: str) -> bool:
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {label}: {detail}")
    return ok


def _report(state: AgentState) -> bool:
    """Print each sub-state and return True only if every node populated it."""
    all_ok = True

    print("\n--- Node output verification ---")

    # Weather node
    w = state.weather
    ok = w is not None and any(
        v is not None
        for v in (w.temperature, w.description, w.humidity, w.wind_speed)
    )
    detail = (
        f"{w.temperature}°C, {w.description!r}, humidity {w.humidity}"
        if w is not None
        else "None"
    )
    all_ok &= _check("WeatherState populated", ok, detail)

    # Alert node (empty list is a VALID result -- there may be no active CAP
    # alerts. We only require the AlertState object itself to exist and its
    # total to be consistent, not that alerts were found.)
    a = state.alerts
    ok = a is not None and a.total_alerts == len(a.alerts)
    detail = (
        f"{a.total_alerts} alert(s), highest_severity={a.highest_severity!r}"
        if a is not None
        else "None (node did not populate AlertState)"
    )
    all_ok &= _check("AlertState populated", ok, detail)

    # Infrastructure node
    infra = state.infrastructure
    if infra is not None:
        counts = {
            "hospitals": len(infra.hospitals),
            "shelters": len(infra.shelters),
            "police": len(infra.police),
            "firestations": len(infra.firestations),
            "pharmacies": len(infra.pharmacies),
        }
        total = sum(counts.values())
        # Object must exist; finding zero facilities is a legitimate real-world
        # outcome (or Overpass being unreachable), so we don't hard-fail on it.
        ok = True
        detail = f"total {total} facilities {counts}"
    else:
        ok = False
        detail = "None (node did not populate InfrastructureState)"
    all_ok &= _check("InfrastructureState populated", ok, detail)

    # Route node
    r = state.route
    ok = r is not None and (
        r.distance_km is not None or r.provider is not None or bool(r.coordinates)
    )
    detail = (
        f"{r.distance_km} km, {r.duration_min} min, provider={r.provider!r}"
        if r is not None
        else "None (node did not populate RouteState)"
    )
    all_ok &= _check("RouteState populated", ok, detail)

    # Coordinator node (Phase 4.2: placeholder summary, NO Gemini)
    rec = state.recommendation
    ok = rec is not None and bool(rec.summary)
    detail = f"summary={rec.summary!r}" if rec is not None else "None"
    all_ok &= _check("RecommendationState populated", ok, detail)

    return all_ok


async def run(question: str, lat: float, lng: float) -> int:
    initial = AgentState(
        user_question=question,
        location=LocationState(latitude=lat, longitude=lng),
    )

    print("=== AIDRAC Phase 4.2 LangGraph smoke test ===")
    print(f"Question : {question}")
    print(f"Location : {lat}, {lng}")

    try:
        result = await graph.ainvoke(initial)
    except Exception as exc:  # pragma: no cover - this is the failure path
        print(f"\n[CRASH] graph.ainvoke raised: {type(exc).__name__}: {exc}")
        print("Phase 4.2 requires nodes to degrade gracefully, not crash.")
        return 2

    state = _as_state(result)
    all_ok = _report(state)

    print("\n--- Full final state ---")
    print(state.model_dump_json(indent=2))

    print("\n=== RESULT:", "ALL NODES POPULATED" if all_ok else "SOME NODES EMPTY", "===")
    return 0 if all_ok else 1


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("-q", "--question", default=DEFAULT_QUESTION)
    parser.add_argument("--lat", type=float, default=DEFAULT_LAT)
    parser.add_argument("--lng", type=float, default=DEFAULT_LNG)
    args = parser.parse_args()

    exit_code = asyncio.run(run(args.question, args.lat, args.lng))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

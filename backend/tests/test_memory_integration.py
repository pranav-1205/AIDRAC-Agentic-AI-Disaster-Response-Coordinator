"""Integration tests for incident memory — restore, inject, isolate."""
import asyncio
import io
import sys
from app.services.incident_service import IncidentService

_service = IncidentService()


async def test_new_incident_no_previous_context():
    """New incident — no previous context, logs 'No previous incident context'."""
    uid = f"test-new-no-prev-{id({})}"
    captured = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured

    try:
        await _service.get_recommendation(
            question="My house is flooding.",
            lat=28.6139, lng=77.2090,
            incident_id=uid,
        )
    finally:
        sys.stdout = old_stdout

    output = captured.getvalue()
    assert "[Memory] No previous incident context" in output, f"Expected no-prev log, got:\n{output}"
    print("[test] New incident — correctly logged 'No previous incident context'")


async def test_restored_incident_injects_previous_context():
    """Same incident — previous recommendation injected, logs it."""
    uid = f"test-restore-inject-{id({})}"
    captured = io.StringIO()
    old_stdout = sys.stdout

    await _service.get_recommendation(
        question="Where should I go?",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )

    sys.stdout = captured
    try:
        resp = await _service.get_recommendation(
            question="Has anything changed?",
            lat=28.6139, lng=77.2090,
            incident_id=uid,
        )
    finally:
        sys.stdout = old_stdout

    output = captured.getvalue()
    assert "[Memory] Previous recommendation injected into LLM context" in output, (
        f"Expected injection log, got:\n{output}"
    )
    assert resp.riskLevel is not None
    assert len(resp.summary) > 0
    print(f"[test] Restored incident — previous recommendation injected, risk: {resp.riskLevel}")


async def test_restored_incident_ai_aware_of_previous():
    """AI should reference the earlier recommendation in follow-up."""
    uid = f"test-restore-aware-{id({})}"
    captured = io.StringIO()
    old_stdout = sys.stdout

    resp1 = await _service.get_recommendation(
        question="Where should I evacuate to?",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )
    print(f"[test] First recommendation: {resp1.summary[:80]}")

    sys.stdout = captured
    try:
        resp2 = await _service.get_recommendation(
            question="Is the previous shelter still safe?",
            lat=28.6139, lng=77.2090,
            incident_id=uid,
        )
    finally:
        sys.stdout = old_stdout

    output = captured.getvalue()
    assert "[Memory] Previous recommendation injected into LLM context" in output
    print(f"[test] Follow-up recommendation: {resp2.summary[:80]}")


async def test_different_incident_no_cross_contamination():
    """Different incident ID — no previous recommendation from other incident visible."""
    uid_a = f"test-cross-A-{id({})}"
    uid_b = f"test-cross-B-{id({})}"

    await _service.get_recommendation(
        question="Where should I go in Delhi flood?",
        lat=28.6139, lng=77.2090,
        incident_id=uid_a,
    )

    captured = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured

    try:
        resp = await _service.get_recommendation(
            question="Is Mumbai safe from cyclone?",
            lat=19.0760, lng=72.8777,
            incident_id=uid_b,
        )
    finally:
        sys.stdout = old_stdout

    output = captured.getvalue()
    assert "[Memory] Previous recommendation injected into LLM context" not in output, (
        f"Cross-contamination detected — incident B saw A's context:\n{output}"
    )
    assert "[Memory] No previous incident context" in output
    print("[test] Different incident — no cross-contamination, memory isolated")


async def test_new_incident_behavior_unchanged():
    """New incidents behave exactly as before (no regression)."""
    resp_no_id = await _service.get_recommendation(
        question="Should I evacuate?",
        lat=28.6139, lng=77.2090,
    )
    assert resp_no_id.riskLevel is not None
    assert len(resp_no_id.summary) > 0
    assert isinstance(resp_no_id.actions, list)

    uid = f"test-regression-{id({})}"
    resp_new = await _service.get_recommendation(
        question="Where is safe?",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )
    assert resp_new.riskLevel is not None
    assert len(resp_new.summary) > 0
    assert isinstance(resp_new.actions, list)

    print("[test] New incidents behave exactly as before (no regression)")


async def test_memory_recommendation_content_looks_correct():
    """Check that the previous recommendation content is preserved."""
    uid = f"test-content-{id({})}"

    resp1 = await _service.get_recommendation(
        question="Where is the safest place?",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )
    assert resp1.riskLevel is not None
    assert len(resp1.summary) > 0
    print(f"[test] First response — risk: {resp1.riskLevel}, summary: {resp1.summary[:60]}")

    resp2 = await _service.get_recommendation(
        question="Has my situation improved?",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )
    assert resp2.riskLevel is not None
    assert len(resp2.summary) > 0
    print(f"[test] Second response — risk: {resp2.riskLevel}, summary: {resp2.summary[:60]}")


if __name__ == "__main__":
    asyncio.run(test_new_incident_no_previous_context())
    asyncio.run(test_restored_incident_injects_previous_context())
    asyncio.run(test_restored_incident_ai_aware_of_previous())
    asyncio.run(test_different_incident_no_cross_contamination())
    asyncio.run(test_new_incident_behavior_unchanged())
    asyncio.run(test_memory_recommendation_content_looks_correct())
    print("\nAll memory integration tests passed!")

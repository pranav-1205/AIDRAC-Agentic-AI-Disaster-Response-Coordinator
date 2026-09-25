import time

import httpx
from typing import Any, Optional
from app.config.settings import settings
from app.utils.latency import LatencyTracker

TIMEOUT = 15
# Large radii cost Overpass far more time (the work grows with the area searched).
# A fixed 15s budget is fine for ~25km but starves wide searches, which previously
# made whole categories silently come back empty.
TIMEOUT_MAX = 60
TIMEOUT_PER_KM = 0.45
# Ceiling for one category's lookup across every mirror.
TOTAL_BUDGET = 90

FALLBACK_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


def timeout_for_radius(radius: int) -> int:
    """Scale the Overpass budget with the search radius, within sane bounds."""
    radius_km = max(0.0, radius / 1000.0)
    return int(min(TIMEOUT_MAX, max(TIMEOUT, TIMEOUT + radius_km * TIMEOUT_PER_KM)))


class OverpassService:
    async def query(self, overpass_ql: str, _tracker: Optional[LatencyTracker] = None, timeout: int = TIMEOUT) -> list[dict[str, Any]]:
        if _tracker:
            _tracker.start("overpass_query")
        
        urls = [settings.OVERPASS_API_URL] + FALLBACK_URLS
        seen = set()
        seen_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                seen_urls.append(url)

        last_error: Exception | None = None
        # Hard ceiling for the whole lookup, so trying extra mirrors can never turn
        # one slow category into a multi-minute HTTP request.
        deadline = time.monotonic() + TOTAL_BUDGET
        for url in seen_urls:
            remaining = deadline - time.monotonic()
            if remaining <= 1:
                print("[overpass] overall budget exhausted, skipping remaining mirrors")
                break
            per_try = max(5, min(timeout, int(remaining)))
            try:
                async with httpx.AsyncClient(timeout=per_try, headers={"User-Agent": "AIDRAC/1.0"}) as client:
                    resp = await client.post(url, data={"data": overpass_ql}, timeout=per_try)
                    resp.raise_for_status()
                    data = resp.json()
                print(f"[overpass] OK: {url}")
                elements = data.get("elements", [])
                result = self._parse_elements(elements)
                if _tracker:
                    _tracker.end("overpass_query")
                return result
            except httpx.TimeoutException:
                print(f"[overpass] timeout ({per_try}s): {url}")
                last_error = OverpassError("Overpass API timed out")
            except httpx.HTTPStatusError as e:
                print(f"[overpass] HTTP {e.response.status_code}: {url}")
                last_error = OverpassError(f"Overpass API returned {e.response.status_code}")
            except Exception as e:
                print(f"[overpass] error: {url} - {e}")
                last_error = OverpassError(f"Overpass request failed: {str(e)}")

        if _tracker:
            _tracker.end("overpass_query", {"error": str(last_error)})
        raise last_error  # type: ignore[misc]

    def _parse_elements(self, elements: list[dict[str, Any]]) -> list[dict[str, Any]]:
        results = []
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name", "").strip()
            lat = el.get("lat") or (el.get("center", {}).get("lat") if el.get("center") else None)
            lng = el.get("lon") or (el.get("center", {}).get("lon") if el.get("center") else None)

            if not name or lat is None or lng is None:
                continue

            address = self._build_address(tags)
            results.append({
                "name": name,
                "latitude": lat,
                "longitude": lng,
                "address": address,
            })
        return results

    def _build_address(self, tags: dict[str, str]) -> str | None:
        parts = []
        for key in ("addr:full", "addr:street", "addr:city", "addr:district", "display_name"):
            val = tags.get(key)
            if val:
                parts.append(val)
        return ", ".join(parts) if parts else None

    def build_query(self, tags: list[str], lat: float, lng: float, radius: int) -> str:
        lines = []
        for tag in tags:
            tag_filter = f'["{tag.split("=")[0]}"="{tag.split("=")[1]}"]' if "=" in tag else f'["{tag}"]'
            for el_type in ("node", "way", "relation"):
                lines.append(f"                {el_type}{tag_filter}(around:{radius},{lat},{lng});")
        return f"""
            [out:json][timeout:{timeout_for_radius(radius)}];
            (
{chr(10).join(lines)}
            );
            out center;
        """


class OverpassError(Exception):
    pass

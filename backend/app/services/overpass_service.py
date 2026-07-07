import httpx
from typing import Any
from app.config.settings import settings

TIMEOUT = 15

FALLBACK_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]


class OverpassService:
    async def query(self, overpass_ql: str) -> list[dict[str, Any]]:
        urls = [settings.OVERPASS_API_URL] + FALLBACK_URLS
        seen = set()
        seen_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                seen_urls.append(url)

        last_error: Exception | None = None
        for url in seen_urls:
            try:
                async with httpx.AsyncClient(timeout=TIMEOUT, headers={"User-Agent": "AIDRAC/1.0"}) as client:
                    resp = await client.post(url, data={"data": overpass_ql})
                    resp.raise_for_status()
                    data = resp.json()
                print(f"[overpass] OK: {url}")
                elements = data.get("elements", [])
                return self._parse_elements(elements)
            except httpx.TimeoutException:
                print(f"[overpass] timeout: {url}")
                last_error = OverpassError("Overpass API timed out")
            except httpx.HTTPStatusError as e:
                print(f"[overpass] HTTP {e.response.status_code}: {url}")
                last_error = OverpassError(f"Overpass API returned {e.response.status_code}")
            except Exception as e:
                print(f"[overpass] error: {url} - {e}")
                last_error = OverpassError(f"Overpass request failed: {str(e)}")

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
            [out:json][timeout:{TIMEOUT}];
            (
{chr(10).join(lines)}
            );
            out center;
        """


class OverpassError(Exception):
    pass

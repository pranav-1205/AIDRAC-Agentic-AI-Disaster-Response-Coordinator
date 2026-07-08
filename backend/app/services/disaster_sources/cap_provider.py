import asyncio
import logging
import xml.etree.ElementTree as ET
from typing import Any
import httpx
from app.config.settings import settings
from app.services.disaster_sources.base import AlertProvider, AlertData
from app.services.disaster_sources.cache import CacheService

logger = logging.getLogger("aidrac.disaster_sources.cap_provider")

CAP_NS = "urn:oasis:names:tc:emergency:cap:1.2"
MAX_ALERTS_PER_FEED = 10


class CapProvider(AlertProvider):
    def __init__(self) -> None:
        self._cache = CacheService()
        self._sources: list[tuple[str, str]] = []

        if settings.IMD_CAP_RSS_URL:
            self._sources.append((settings.IMD_CAP_RSS_URL, "imd"))

        if settings.NDMA_CAP_RSS_URL:
            self._sources.append((settings.NDMA_CAP_RSS_URL, "ndma"))

    async def clear_cache(self) -> None:
        self._cache.clear()

    async def get_alerts(self) -> list[AlertData]:
        cached = self._cache.get("merged_alerts")
        if cached is not None:
            logger.info("Returning %d cached merged alerts", len(cached))
            return cached

        tasks = [
            self._safe_process_feed(url, label) for url, label in self._sources
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        seen: set[str] = set()
        merged: list[AlertData] = []

        for r in results:
            if isinstance(r, list):
                for alert in r:
                    if alert.external_id not in seen:
                        seen.add(alert.external_id)
                        merged.append(alert)

        logger.info("Merged %d unique alerts from %d sources", len(merged), len(self._sources))

        if merged:
            self._cache.set("merged_alerts", merged, ttl=settings.CACHE_TTL_SECONDS)
        else:
            stale = self._cache.get("merged_alerts")
            if stale is not None:
                logger.info("All feeds failed — serving %d stale cached alerts", len(stale))
                return stale

        return merged

    async def _safe_process_feed(self, url: str, label: str) -> list[AlertData]:
        try:
            return await self._process_feed(url, label)
        except Exception as exc:
            logger.warning("Feed %s (%s) failed: %s", label, url, exc)
            return []

    async def _process_feed(self, url: str, label: str) -> list[AlertData]:
        logger.info("Fetching CAP RSS: %s (%s)", label, url)

        cache_key = f"rss:{url}"
        cached_rss = self._cache.get(cache_key)
        if cached_rss is not None:
            rss_text = cached_rss
            logger.debug("RSS cache hit for %s", url)
        else:
            async with httpx.AsyncClient(timeout=30.0) as client:
                rss_resp = await client.get(url)
                rss_resp.raise_for_status()
                rss_text = rss_resp.text
                self._cache.set(cache_key, rss_text, ttl=settings.CACHE_TTL_SECONDS)
                logger.debug("RSS cache miss — fetched %d bytes from %s", len(rss_text), url)

        items = self._parse_rss_items(rss_text)
        logger.info("RSS Items for %s: %d", label, len(items))

        if not items:
            return []

        recent = items[:MAX_ALERTS_PER_FEED]

        cap_urls = []
        for i, item in enumerate(recent):
            cap_url = self._extract_cap_url(item)
            if cap_url:
                cap_urls.append(cap_url)
            else:
                logger.warning("RSS item %d in %s has no CAP XML URL (keys: %s)", i, label, list(item.keys()))

        logger.info("Downloading CAP XML for %s: %d files", label, len(cap_urls))

        alerts: list[AlertData] = []
        for url in cap_urls:
            alert = await self._fetch_cap_xml(url, label)
            if alert is not None:
                alerts.append(alert)

        logger.info("Parsed %d CAP alerts from %s", len(alerts), label)
        return alerts

    @staticmethod
    def _extract_cap_url(item: dict[str, str]) -> str | None:
        candidates = ["link", "guid", "id"]
        for key in candidates:
            val = item.get(key, "").strip()
            if val and (val.startswith("http://") or val.startswith("https://")):
                return val
            if key == "enclosure":
                enclosure = item.get("enclosure_url", "") or item.get("enclosure", "")
                if enclosure and (enclosure.startswith("http://") or enclosure.startswith("https://")):
                    return enclosure
        return None

    @staticmethod
    def _parse_rss_items(raw_xml: str) -> list[dict[str, str]]:
        root = ET.fromstring(raw_xml)
        items: list[dict[str, str]] = []
        for item_elem in root.iter("item"):
            item: dict[str, str] = {}
            for child in item_elem:
                tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                text = (child.text or "").strip()
                item[tag] = text

                if child.tag.endswith("enclosure"):
                    item["enclosure_url"] = child.get("url", "")
            items.append(item)
        return items

    async def _fetch_cap_xml(self, url: str, label: str) -> AlertData | None:
        cache_key = f"cap:{url}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            logger.debug("CAP XML cache hit for %s", url)
            return cached

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                alert = self._parse_single_alert(resp.content, label)
                if alert is not None:
                    self._cache.set(cache_key, alert, ttl=settings.CACHE_TTL_SECONDS)
                return alert
        except Exception as exc:
            logger.warning("Failed to fetch/parse CAP XML %s for %s: %s", url, label, exc)
            return None

    @staticmethod
    def _parse_single_alert(raw_xml: bytes, label: str = "unknown") -> AlertData | None:
        try:
            root = ET.fromstring(raw_xml)
        except ET.ParseError as exc:
            logger.error("CAP XML ParseError for %s: %s", label, exc)
            return None

        ns = CAP_NS

        identifier = CapProvider._cap_text(root, ns, "identifier")
        if not identifier:
            logger.warning("CAP XML missing identifier for %s — skipping", label)
            return None

        info = root.find(f"{{{ns}}}info")
        if info is None:
            logger.warning("CAP XML %s for %s missing <info> — skipping", identifier, label)
            return None

        event = CapProvider._cap_text(info, ns, "event") or ""
        headline = CapProvider._cap_text(info, ns, "headline") or ""
        description = CapProvider._cap_text(info, ns, "description") or ""
        instruction = CapProvider._cap_text(info, ns, "instruction") or ""
        severity = CapProvider._cap_text(info, ns, "severity") or "Unknown"
        urgency = CapProvider._cap_text(info, ns, "urgency") or "Unknown"
        certainty = CapProvider._cap_text(info, ns, "certainty") or "Unknown"
        effective = CapProvider._cap_text(info, ns, "effective")
        expires = CapProvider._cap_text(info, ns, "expires")

        full_desc = description
        if instruction:
            full_desc = f"{description}\n\n{instruction}"

        area_elem = info.find(f"{{{ns}}}area")
        area_str = ""
        polygons: list[str] = []
        if area_elem is not None:
            area_desc_el = area_elem.find(f"{{{ns}}}areaDesc")
            if area_desc_el is not None and area_desc_el.text:
                area_str = area_desc_el.text.strip()
            for poly in area_elem.iter(f"{{{ns}}}polygon"):
                if poly.text:
                    polygons.append(poly.text.strip())

        return AlertData(
            external_id=identifier,
            event=event,
            headline=headline or event,
            description=full_desc,
            severity=CapProvider._normalize_severity(severity),
            urgency=urgency,
            certainty=certainty,
            area=area_str,
            effective=effective,
            expires=expires,
            polygons=polygons if polygons else None,
            source=label,
        )

    @staticmethod
    def _cap_text(parent: Any, ns: str, tag: str) -> str | None:
        el = parent.find(f"{{{ns}}}{tag}")
        if el is not None and el.text:
            return el.text.strip()
        return None

    @staticmethod
    def _normalize_severity(severity: str) -> str:
        mapping = {
            "extreme": "critical",
            "severe": "warning",
            "moderate": "advisory",
            "minor": "info",
            "unknown": "info",
        }
        return mapping.get(severity.lower().strip(), "info")

import asyncio
import logging
import xml.etree.ElementTree as ET
from typing import Any
import httpx
from app.config.settings import settings
from app.services.disaster_sources.base import AlertProvider, AlertData, canonical_alert_id
from app.services.disaster_sources.cache import CacheService

logger = logging.getLogger("aidrac.disaster_sources.cap_provider")
logger.setLevel(logging.INFO)
if not logger.handlers:
    _sh = logging.StreamHandler()
    _sh.setLevel(logging.INFO)
    _sh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s", datefmt="%H:%M:%S"))
    logger.addHandler(_sh)
    logger.propagate = False

CAP_NS = "urn:oasis:names:tc:emergency:cap:1.2"

MAX_XML_PER_FEED = 3
CONCURRENT_XML_LIMIT = 2
DELAY_BETWEEN_XML = 1.0
MAX_RETRIES = 1
RETRY_BACKOFF = 30.0
INITIAL_DELAY = 2.0
BATCH_RETRY_DELAY = 0


class CapProvider(AlertProvider):
    def __init__(self) -> None:
        self._cache = CacheService()
        self._sources: list[tuple[str, str]] = []
        self._xml_semaphore = asyncio.Semaphore(CONCURRENT_XML_LIMIT)

        if settings.IMD_CAP_RSS_URL:
            self._sources.append((settings.IMD_CAP_RSS_URL, "imd"))
            logger.info("IMD source added: %s", settings.IMD_CAP_RSS_URL)
        else:
            logger.warning("IMD source NOT added — URL is empty/falsy")

        if settings.NDMA_CAP_RSS_URL:
            self._sources.append((settings.NDMA_CAP_RSS_URL, "ndma"))
            logger.info("NDMA source added: %s", settings.NDMA_CAP_RSS_URL)
        else:
            logger.warning("NDMA source NOT added — URL is empty/falsy")

        logger.info("CapProvider initialized with %d sources", len(self._sources))

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
                    dedup_key = canonical_alert_id(alert.external_id)
                    if dedup_key not in seen:
                        seen.add(dedup_key)
                        merged.append(alert)

        logger.info("[CAP] Merged %d unique alerts from %d sources", len(merged), len(self._sources))

        if merged:
            self._cache.set("merged_alerts", merged, ttl=settings.CACHE_TTL_SECONDS)
            logger.info("[CAP] Cached %d alerts for %d seconds", len(merged), settings.CACHE_TTL_SECONDS)

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
        logger.info("[CAP] %s RSS items: %d", label, len(items))

        if not items:
            return []

        cap_urls: list[tuple[str, str | None]] = []
        for i, item in enumerate(items):
            cap_url = self._extract_cap_url(item)
            if cap_url:
                # pubDate is the time the NDMA RSS feed published this alert.
                # Keep it paired with its CAP document throughout ingestion.
                cap_urls.append((cap_url, item.get("pubDate") or item.get("date")))
            else:
                logger.warning("[CAP] %s item %d has no CAP XML URL (keys: %s)", label, i, list(item.keys()))

        logger.info("[CAP] %s CAP XML URLs extracted: %d / %d items", label, len(cap_urls), len(items))

        limited_urls = cap_urls[:MAX_XML_PER_FEED]
        if len(cap_urls) > MAX_XML_PER_FEED:
            logger.info("[CAP] %s limiting to first %d CAP XML URLs (total available: %d)", label, MAX_XML_PER_FEED, len(cap_urls))

        alerts: list[AlertData] = []
        max_batch_retries = 1 if BATCH_RETRY_DELAY > 0 else 0
        urls_to_fetch = list(limited_urls)
        batch_attempt = 0

        while urls_to_fetch and batch_attempt <= max_batch_retries:
            if batch_attempt > 0:
                logger.info("[CAP] %s batch retry %d/%d for %d URLs after %.1fs cooldown", label, batch_attempt, max_batch_retries, len(urls_to_fetch), BATCH_RETRY_DELAY)
                await asyncio.sleep(BATCH_RETRY_DELAY)
            else:
                logger.info("[CAP] %s initial delay of %.1fs before CAP XML fetches", label, INITIAL_DELAY)
                await asyncio.sleep(INITIAL_DELAY)

            rate_limited_urls: list[tuple[str, str | None]] = []
            for idx, (xml_url, published_at) in enumerate(urls_to_fetch):
                if idx > 0:
                    await asyncio.sleep(DELAY_BETWEEN_XML)
                alert, was_limited = await self._fetch_cap_xml(xml_url, label, published_at)
                if alert is not None:
                    alerts.append(alert)
                elif was_limited:
                    rate_limited_urls.append((xml_url, published_at))

            if rate_limited_urls and batch_attempt < max_batch_retries:
                urls_to_fetch = [
                    (url, published_at)
                    for url, published_at in rate_limited_urls
                    if self._cache.get(f"cap:{url}") is None
                ]
                if urls_to_fetch:
                    batch_attempt += 1
                    logger.info("[CAP] %s %d URLs rate-limited, will retry batch after cooldown", label, len(urls_to_fetch))
                    continue
            break

        logger.info("[CAP] %s parsed: %d alerts from %d CAP XML files", label, len(alerts), len(limited_urls))
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

    async def _fetch_cap_xml(
        self, url: str, label: str, published_at: str | None = None
    ) -> tuple[AlertData | None, bool]:
        cache_key = f"cap:{url}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            logger.debug("CAP XML cache hit for %s", url)
            # Older cached values may predate the RSS timestamp field.
            if published_at and not cached.published_at:
                cached.published_at = published_at
            return cached, False

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }

        async with self._xml_semaphore:
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    if attempt > 1:
                        delay = RETRY_BACKOFF * (2 ** (attempt - 2))
                        logger.info("CAP XML retry %d/%d for %s after %.1fs", attempt, MAX_RETRIES, url, delay)
                        await asyncio.sleep(delay)
                    async with httpx.AsyncClient(timeout=30.0, follow_redirects=False, headers=headers) as client:
                        resp = await client.get(url)
                        if resp.status_code == 302:
                            location = resp.headers.get("location", "")
                            if attempt < MAX_RETRIES:
                                logger.warning("CAP XML %s for %s returned 302 to %s — rate limited, retrying (%d/%d)", url, label, location, attempt, MAX_RETRIES)
                                continue
                            else:
                                logger.warning("CAP XML %s for %s returned 302 to %s — rate limited, giving up after %d retries", url, label, location, MAX_RETRIES)
                                return None, True
                        resp.raise_for_status()
                        alert = self._parse_single_alert(resp.content, label, published_at)
                        if alert is not None:
                            self._cache.set(cache_key, alert, ttl=settings.CACHE_TTL_SECONDS)
                        return alert, False
                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code == 302:
                        if attempt < MAX_RETRIES:
                            logger.warning("CAP XML %s for %s returned 302 — retrying (%d/%d)", url, label, attempt, MAX_RETRIES)
                            continue
                        else:
                            logger.warning("CAP XML %s for %s returned 302 — giving up after %d retries", url, label, MAX_RETRIES)
                            return None, True
                    logger.warning("Failed to fetch/parse CAP XML %s for %s (attempt %d/%d): %s", url, label, attempt, MAX_RETRIES, exc)
                    return None, False
                except Exception as exc:
                    logger.warning("Failed to fetch/parse CAP XML %s for %s (attempt %d/%d): %s", url, label, attempt, MAX_RETRIES, exc)
                    return None, False
            return None, True

    @staticmethod
    def _parse_single_alert(
        raw_xml: bytes, label: str = "unknown", published_at: str | None = None
    ) -> AlertData | None:
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

        # RSS <pubDate> represents the website publication time. CAP <sent>
        # is a reliable fallback for feeds that omit it.
        published_at = published_at or CapProvider._cap_text(root, ns, "sent")

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
            published_at=published_at,
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

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from app.services.disaster_sources.cap_provider import CapProvider
from app.services.disaster_sources.normalizer import alert_data_to_dict

logger = logging.getLogger("aidrac.disaster_sources.ingestion_service")


class IngestionService:
    def __init__(self) -> None:
        self._cap = CapProvider()

    async def ingest(self, db: AsyncSession) -> list[Alert]:
        try:
            return await self._ingest(db)
        except Exception:
            await db.rollback()
            logger.exception("CAP ingestion failed — transaction rolled back")
            return []

    async def _ingest(self, db: AsyncSession) -> list[Alert]:
        cap_alerts = await self._cap.get_alerts()

        if not cap_alerts:
            logger.warning("No CAP alerts returned from provider — skipping ingestion")
            return []

        existing = await self._load_existing_by_external_id(db)
        logger.debug("Existing CAP alerts in DB: %d", len(existing))

        inserted = 0
        updated = 0
        ingested: list[Alert] = []

        for alert_data in cap_alerts:
            fields = alert_data_to_dict(alert_data)
            row = existing.get(alert_data.external_id)

            if row is not None:
                for key, value in fields.items():
                    setattr(row, key, value)
                if not row.is_active:
                    row.is_active = True
                    row.expired_at = None
                updated += 1
            else:
                row = Alert(**fields)
                db.add(row)
                inserted += 1

            ingested.append(row)

        await db.flush()
        logger.info("Inserted: %d  Updated: %d", inserted, updated)

        expired_count = await self._soft_expire(db)
        logger.info("Soft-expired: %d", expired_count)

        await db.commit()
        logger.info("Database Commit Successful")

        return ingested

    async def _load_existing_by_external_id(
        self, db: AsyncSession
    ) -> dict[str, Alert]:
        result = await db.execute(
            select(Alert).where(Alert.external_id.isnot(None))
        )
        rows = result.scalars().all()
        return {r.external_id: r for r in rows if r.external_id}

    async def _soft_expire(self, db: AsyncSession) -> int:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Alert).where(
                Alert.is_active.is_(True),
                Alert.expires_at.isnot(None),
                Alert.expires_at < now,
            )
        )
        expired = list(result.scalars().all())
        for row in expired:
            row.is_active = False
            row.expired_at = now
        if expired:
            await db.flush()
        return len(expired)

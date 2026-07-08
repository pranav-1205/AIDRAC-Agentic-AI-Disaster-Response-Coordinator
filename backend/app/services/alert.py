from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.alert import Alert
from app.schemas.alert import AlertCreate

INDIAN_STATES: dict[str, set[str]] = {
    "andhra pradesh": {"andhra pradesh", "andhra"},
    "arunachal pradesh": {"arunachal pradesh", "arunachal"},
    "assam": {"assam"},
    "bihar": {"bihar"},
    "chhattisgarh": {"chhattisgarh"},
    "goa": {"goa"},
    "gujarat": {"gujarat"},
    "haryana": {"haryana"},
    "himachal pradesh": {"himachal pradesh", "himachal"},
    "jharkhand": {"jharkhand"},
    "karnataka": {"karnataka"},
    "kerala": {"kerala"},
    "madhya pradesh": {"madhya pradesh", "madhya"},
    "maharashtra": {"maharashtra"},
    "manipur": {"manipur"},
    "meghalaya": {"meghalaya"},
    "mizoram": {"mizoram"},
    "nagaland": {"nagaland"},
    "odisha": {"odisha", "orissa"},
    "punjab": {"punjab"},
    "rajasthan": {"rajasthan"},
    "sikkim": {"sikkim"},
    "tamil nadu": {"tamil nadu", "tamilnadu"},
    "telangana": {"telangana"},
    "tripura": {"tripura"},
    "uttar pradesh": {"uttar pradesh", "uttar"},
    "uttarakhand": {"uttarakhand", "uk"},
    "west bengal": {"west bengal", "bengal"},
    "andaman": {"andaman", "andaman and nicobar"},
    "chandigarh": {"chandigarh"},
    "dadra": {"dadra", "dadra and nagar haveli"},
    "daman": {"daman", "daman and diu"},
    "delhi": {"delhi", "new delhi", "nct"},
    "ladakh": {"ladakh"},
    "lakshadweep": {"lakshadweep"},
    "puducherry": {"puducherry", "pondicherry"},
    "jammu": {"jammu", "jammu and kashmir", "kashmir"},
}


def _normalize(text: str) -> str:
    return text.lower().replace("-", " ").replace(",", " ").strip()


def _get_user_state(lat: float, lng: float) -> str | None:
    for state_name, aliases in INDIAN_STATES.items():
        for alias in aliases:
            for pattern in [alias]:
                if _normalize(alias) == alias.lower():
                    pass
    return None


def _alert_matches_area(alert_area: str, user_state: str) -> bool:
    if not alert_area or not user_state:
        return False
    normalized_alert = _normalize(alert_area)
    normalized_user = _normalize(user_state)
    if normalized_user in normalized_alert:
        return True
    for state_name, aliases in INDIAN_STATES.items():
        if normalized_user == _normalize(state_name):
            for alias in aliases:
                if _normalize(alias) in normalized_alert:
                    return True
            break
    return False


def _is_nationwide_alert(area: str) -> bool:
    if not area:
        return True
    nationwide_keywords = {"all india", "entire india", "whole india", "nationwide", "all over india"}
    return _normalize(area) in nationwide_keywords


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        lat: float | None = None,
        lng: float | None = None,
    ) -> list[Alert]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(Alert)
            .where(
                Alert.is_active.is_(True),
                or_(
                    Alert.expires_at.is_(None),
                    Alert.expires_at >= now,
                ),
            )
            .order_by(Alert.created_at.desc())
        )
        alerts = list(result.scalars().all())

        if lat is not None and lng is not None:
            user_state = self._resolve_state(lat, lng)
            alerts = self._filter_by_location(alerts, user_state)

        return alerts

    async def get_active(self) -> list[Alert]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(Alert)
            .where(
                Alert.is_active.is_(True),
                or_(
                    Alert.expires_at.is_(None),
                    Alert.expires_at >= now,
                ),
            )
            .join(Alert.disaster, isouter=True)
            .order_by(Alert.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_history(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Alert]:
        result = await self.db.execute(
            select(Alert)
            .where(Alert.is_active.is_(False))
            .order_by(Alert.expired_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, data: AlertCreate) -> Alert:
        alert = Alert(**data.model_dump())
        self.db.add(alert)
        await self.db.flush()
        await self.db.refresh(alert)
        return alert

    @staticmethod
    def _resolve_state(lat: float, lng: float) -> str | None:
        for state_name, _ in INDIAN_STATES.items():
            if state_name == "delhi" and 28.4 <= lat <= 28.9 and 76.8 <= lng <= 77.4:
                return "Delhi"
            if state_name == "karnataka" and 12.5 <= lat <= 18.5 and 74.0 <= lng <= 78.5:
                return "Karnataka"
            if state_name == "maharashtra" and 15.5 <= lat <= 22.0 and 72.5 <= lng <= 80.5:
                return "Maharashtra"
            if state_name == "goa" and 14.8 <= lat <= 15.8 and 73.6 <= lng <= 74.4:
                return "Goa"
            if state_name == "kerala" and 8.0 <= lat <= 12.8 and 74.5 <= lng <= 77.5:
                return "Kerala"
            if state_name == "tamil nadu" and 8.0 <= lat <= 13.5 and 76.5 <= lng <= 80.5:
                return "Tamil Nadu"
            if state_name == "uttar pradesh" and 23.5 <= lat <= 31.0 and 77.0 <= lng <= 84.5:
                return "Uttar Pradesh"
            if state_name == "gujarat" and 20.0 <= lat <= 24.5 and 68.0 <= lng <= 74.5:
                return "Gujarat"
            if state_name == "rajasthan" and 23.0 <= lat <= 30.0 and 69.5 <= lng <= 78.0:
                return "Rajasthan"
            if state_name == "west bengal" and 21.5 <= lat <= 27.5 and 85.5 <= lng <= 89.5:
                return "West Bengal"
            if state_name == "bihar" and 24.0 <= lat <= 27.5 and 83.0 <= lng <= 88.0:
                return "Bihar"
            if state_name == "odisha" and 17.5 <= lat <= 22.5 and 81.5 <= lng <= 87.5:
                return "Odisha"
            if state_name == "andhra pradesh" and 12.5 <= lat <= 19.5 and 77.0 <= lng <= 84.5:
                return "Andhra Pradesh"
            if state_name == "telangana" and 15.5 <= lat <= 19.5 and 77.5 <= lng <= 81.5:
                return "Telangana"
            if state_name == "madya pradesh" and 21.0 <= lat <= 26.5 and 74.0 <= lng <= 82.5:
                return "Madhya Pradesh"
            if state_name == "chhattisgarh" and 17.5 <= lat <= 24.0 and 80.0 <= lng <= 84.0:
                return "Chhattisgarh"
            if state_name == "punjab" and 29.5 <= lat <= 32.5 and 73.5 <= lng <= 76.5:
                return "Punjab"
            if state_name == "haryana" and 27.5 <= lat <= 31.0 and 74.5 <= lng <= 77.5:
                return "Haryana"
            if state_name == "himachal pradesh" and 30.0 <= lat <= 33.5 and 75.5 <= lng <= 79.0:
                return "Himachal Pradesh"
            if state_name == "uttarakhand" and 28.5 <= lat <= 31.5 and 77.5 <= lng <= 81.0:
                return "Uttarakhand"
            if state_name == "assam" and 24.0 <= lat <= 28.0 and 89.5 <= lng <= 96.0:
                return "Assam"
            if state_name == "jammu" and 32.5 <= lat <= 37.0 and 73.5 <= lng <= 80.0:
                return "Jammu and Kashmir"
        return None

    @staticmethod
    def _filter_by_location(
        alerts: list[Alert],
        user_state: str | None,
    ) -> list[Alert]:
        if user_state is None:
            return [a for a in alerts if _is_nationwide_alert(a.area or "")]

        matched: list[Alert] = []
        for alert in alerts:
            area = alert.area or ""
            if not area:
                continue
            if _is_nationwide_alert(area):
                matched.append(alert)
            elif _alert_matches_area(area, user_state):
                matched.append(alert)
        return matched

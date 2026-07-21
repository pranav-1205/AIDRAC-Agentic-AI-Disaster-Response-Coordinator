"""Test the risk assessment service with the 3 specified cases."""

from dataclasses import dataclass

import pytest
from app.services.risk_assessment_service import (
    _classify_user_risk,
    _classify_weather_risk,
    _evaluate_disaster_risk,
    _evaluate_infrastructure_risk,
    _evaluate_user_alert_risk,
    _highest_alert_severity,
)


def weather(desc: str, temp: float = 25) -> dict:
    return {"description": desc, "temperature": temp}


@dataclass
class FakeAlert:
    severity: str
    polygons: str | None = None
    area: str | None = None
    event: str | None = None


@pytest.fixture
def critical_alerts_far():
    """51 critical alerts with polygons, centroids > 50km away."""
    return [
        FakeAlert(
            severity="critical",
            polygons="75.0 26.0 76.0 26.0 76.0 27.0 75.0 27.0 75.0 26.0",
            area="Far district",
        )
        for _ in range(51)
    ]


@pytest.fixture
def polygon_alert_with_evacuation():
    return FakeAlert(
        severity="critical",
        polygons="27.0 26.0 28.0 26.0 28.0 27.0 27.0 27.0 27.0 26.0",
        area="Local Area",
        event="Evacuation order issued",
    )


@pytest.fixture
def polygon_alert_no_evacuation():
    return FakeAlert(
        severity="high",
        polygons="27.0 26.0 28.0 26.0 28.0 27.0 27.0 27.0 27.0 26.0",
        area="Local Area",
        event="Flood warning",
    )


class TestCase1_LowRiskWithCriticalRegionalAlerts:
    def test_user_outside_polygons_light_rain(self, critical_alerts_far):
        """51 critical regional alerts, user outside all polygons, light rain."""
        lat, lng = 28.6139, 77.2090  # Delhi — far from Rajasthan polygons

        alert_score, nearby_alerts, inside_polygon, evacuation = _evaluate_user_alert_risk(
            critical_alerts_far, lat, lng
        )
        weather_label, weather_score = _classify_weather_risk(weather("light rain", 25))
        disaster_score, _ = _evaluate_disaster_risk([], lat, lng)
        infra_score = _evaluate_infrastructure_risk(None)

        total = alert_score + weather_score + disaster_score + infra_score
        user_risk = _classify_user_risk(total, inside_polygon, evacuation)
        regional_severity = _highest_alert_severity(critical_alerts_far)

        assert alert_score == 0, f"Expected 0 alert score, got {alert_score}"
        assert nearby_alerts == 0, f"Expected 0 nearby, got {nearby_alerts}"
        assert inside_polygon is False
        assert evacuation is False
        assert weather_score == 15, f"Expected 15 for light rain, got {weather_score}"
        assert total == 25, f"Expected total 25 (15 weather + 10 infra), got {total}"
        assert user_risk == "LOW", f"Expected LOW, got {user_risk}"
        assert regional_severity == "CRITICAL", f"Expected CRITICAL, got {regional_severity}"


class TestCase2_ExtremeInsidePolygon:
    def test_inside_critical_polygon_with_evacuation(self, polygon_alert_with_evacuation):
        """User inside CAP polygon with evacuation order."""
        lat, lng = 27.5, 26.5  # inside the polygon

        alert_score, nearby_alerts, inside_polygon, evacuation = _evaluate_user_alert_risk(
            [polygon_alert_with_evacuation], lat, lng
        )
        weather_label, weather_score = _classify_weather_risk(weather("broken clouds", 28))
        disaster_score, _ = _evaluate_disaster_risk([], lat, lng)
        infra_score = _evaluate_infrastructure_risk(None)

        total = alert_score + weather_score + disaster_score + infra_score
        user_risk = _classify_user_risk(total, inside_polygon, evacuation)
        regional_severity = _highest_alert_severity([polygon_alert_with_evacuation])

        assert inside_polygon is True, "Should detect inside polygon"
        assert evacuation is True, "Should detect evacuation order"
        assert alert_score >= 25, f"Expected alert_score >= 25, got {alert_score}"
        assert user_risk == "EXTREME", f"Expected EXTREME, got {user_risk}"
        assert regional_severity == "CRITICAL", f"Expected CRITICAL, got {regional_severity}"
        assert nearby_alerts == 1, f"Expected 1 nearby, got {nearby_alerts}"

    def test_inside_high_polygon_no_evacuation(self, polygon_alert_no_evacuation):
        """User inside high-severity polygon without evacuation."""
        lat, lng = 27.5, 26.5

        alert_score, nearby_alerts, inside_polygon, evacuation = _evaluate_user_alert_risk(
            [polygon_alert_no_evacuation], lat, lng
        )
        weather_label, weather_score = _classify_weather_risk(weather("broken clouds", 28))
        disaster_score, _ = _evaluate_disaster_risk([], lat, lng)
        infra_score = _evaluate_infrastructure_risk(None)

        total = alert_score + weather_score + disaster_score + infra_score
        user_risk = _classify_user_risk(total, inside_polygon, evacuation)

        assert inside_polygon is True, "Should detect inside polygon"
        assert evacuation is False
        assert total >= 15, f"Expected total >= 15, got {total}"
        assert user_risk == "EXTREME", f"Expected EXTREME (polygon override), got {user_risk}"


class TestCase3_ModerateFromLocalWeather:
    def test_heavy_rain_no_alerts(self):
        """Heavy rain locally, no CAP alerts, no disasters."""
        lat, lng = 19.0760, 72.8777

        alert_score, nearby_alerts, inside_polygon, evacuation = _evaluate_user_alert_risk(
            [], lat, lng
        )
        weather_label, weather_score = _classify_weather_risk(weather("heavy rain", 25))
        disaster_score, _ = _evaluate_disaster_risk([], lat, lng)
        infra_score = _evaluate_infrastructure_risk(None)

        total = alert_score + weather_score + disaster_score + infra_score
        user_risk = _classify_user_risk(total, inside_polygon, evacuation)
        regional_severity = _highest_alert_severity([])

        assert alert_score == 0
        assert weather_score == 30, f"Expected 30 for heavy rain, got {weather_score}"
        assert infra_score == 10, f"Expected 10 for no infra, got {infra_score}"
        assert total == 40, f"Expected total 40 (30 weather + 10 infra), got {total}"
        assert user_risk == "MODERATE", f"Expected MODERATE, got {user_risk}"
        assert regional_severity == "NONE", f"Expected NONE, got {regional_severity}"
        assert evacuation is False


class TestWeatherScoring:
    def test_clear_sky(self):
        label, score = _classify_weather_risk(weather("clear sky", 30))
        assert score == 0 and label == "NONE"

    def test_rain(self):
        label, score = _classify_weather_risk(weather("light rain", 25))
        assert score == 15 and label == "LOW"

    def test_heavy_rain(self):
        label, score = _classify_weather_risk(weather("heavy rain", 25))
        assert score == 30 and label == "HIGH"

    def test_thunderstorm(self):
        label, score = _classify_weather_risk(weather("thunderstorm", 30))
        assert score == 40 and label == "EXTREME"

    def test_flood(self):
        label, score = _classify_weather_risk(weather("flood", 25))
        assert score == 30 and label == "HIGH"

    def test_extreme_heat(self):
        label, score = _classify_weather_risk(weather("haze", 46))
        assert score == 45 and label == "EXTREME"

    def test_freezing(self):
        label, score = _classify_weather_risk(weather("snow", -5))
        assert score == 30 and label == "HIGH"


class TestClassificationThresholds:
    def test_safe(self):
        assert _classify_user_risk(0, False, False) == "SAFE"
        assert _classify_user_risk(10, False, False) == "SAFE"

    def test_low(self):
        assert _classify_user_risk(11, False, False) == "LOW"
        assert _classify_user_risk(25, False, False) == "LOW"

    def test_moderate(self):
        assert _classify_user_risk(26, False, False) == "MODERATE"
        assert _classify_user_risk(45, False, False) == "MODERATE"

    def test_high(self):
        assert _classify_user_risk(46, False, False) == "HIGH"
        assert _classify_user_risk(70, False, False) == "HIGH"

    def test_extreme(self):
        assert _classify_user_risk(71, False, False) == "EXTREME"

    def test_evacuation_override(self):
        assert _classify_user_risk(0, False, True) == "EXTREME"

    def test_polygon_override(self):
        assert _classify_user_risk(5, True, False) == "SAFE"
        assert _classify_user_risk(15, True, False) == "EXTREME"


class TestRegionalSeverity:
    def test_mixed_severities(self):
        alerts = [
            FakeAlert(severity="advisory"),
            FakeAlert(severity="warning"),
            FakeAlert(severity="critical"),
        ]
        assert _highest_alert_severity(alerts) == "CRITICAL"

    def test_no_alerts(self):
        assert _highest_alert_severity([]) == "NONE"

    def test_single_advisory(self):
        assert _highest_alert_severity([FakeAlert(severity="advisory")]) == "ADVISORY"

from datetime import timezone

from app.services.disaster_sources.cap_provider import CapProvider
from app.services.disaster_sources.base import canonical_alert_id
from app.services.disaster_sources.normalizer import alert_data_to_dict


CAP_XML = b'''<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>ndma-test-1</identifier>
  <sent>2026-07-20T08:00:00+05:30</sent>
  <info>
    <event>Heavy Rain</event><headline>Heavy rain warning</headline>
    <description>Expect heavy rain.</description><severity>Severe</severity>
    <urgency>Immediate</urgency><certainty>Likely</certainty>
    <area><areaDesc>Delhi</areaDesc></area>
  </info>
</alert>'''


def test_rss_publication_time_is_saved_as_alert_created_at():
    rss_pub_date = "Mon, 20 Jul 2026 09:30:00 +0530"
    alert = CapProvider._parse_single_alert(CAP_XML, "ndma", rss_pub_date)

    assert alert is not None
    assert alert.published_at == rss_pub_date
    fields = alert_data_to_dict(alert)
    assert fields["created_at"].astimezone(timezone.utc).isoformat() == "2026-07-20T04:00:00+00:00"


def test_cap_sent_time_is_used_when_rss_omits_publication_time():
    alert = CapProvider._parse_single_alert(CAP_XML, "ndma")

    assert alert is not None
    assert alert.published_at == "2026-07-20T08:00:00+05:30"


def test_ndma_target_suffixes_share_one_deduplication_key():
    assert canonical_alert_id("IN-1784645534579012_12") == "IN-1784645534579012"
    assert canonical_alert_id("IN-1784645534579012_50") == "IN-1784645534579012"
    assert canonical_alert_id("urn:oid:2.49.0.1.356.0.2026.7.21.13.2.10") == "urn:oid:2.49.0.1.356.0.2026.7.21.13.2.10"

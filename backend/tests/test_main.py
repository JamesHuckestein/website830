import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.seed import reset_to_seed

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset():
    reset_to_seed()
    yield
    reset_to_seed()


def _token(member_number: str = "8301001", passcode: str = "faith830") -> str:
    r = client.post("/auth/login", json={"membershipNumber": member_number, "passcode": passcode})
    assert r.status_code == 200
    return r.json()["token"]


def _auth(member_number: str = "8301001", passcode: str = "faith830") -> dict:
    return {"Authorization": f"Bearer {_token(member_number, passcode)}"}


def _officer_auth() -> dict:
    return _auth("8301002", "charity830")  # John Akers — Grand Knight


def _non_officer_auth() -> dict:
    return _auth("8301004", "hope830")  # Mark Radcliffe — no officer position


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def test_login_officer_returns_is_officer_true():
    r = client.post("/auth/login", json={"membershipNumber": "8301002", "passcode": "charity830"})
    assert r.status_code == 200
    assert "token" in r.json()
    import jwt as pyjwt
    payload = pyjwt.decode(r.json()["token"], options={"verify_signature": False})
    assert payload["isOfficer"] is True


def test_login_non_officer_returns_is_officer_false():
    r = client.post("/auth/login", json={"membershipNumber": "8301004", "passcode": "hope830"})
    assert r.status_code == 200
    import jwt as pyjwt
    payload = pyjwt.decode(r.json()["token"], options={"verify_signature": False})
    assert payload["isOfficer"] is False


def test_login_wrong_passcode():
    r = client.post("/auth/login", json={"membershipNumber": "8301001", "passcode": "wrong"})
    assert r.status_code == 401


def test_login_unknown_member():
    r = client.post("/auth/login", json={"membershipNumber": "9999999", "passcode": "anything"})
    assert r.status_code == 401


def test_login_member_with_null_passcode_rejected():
    # Member 8301003 has no passcode in seed
    r = client.post("/auth/login", json={"membershipNumber": "8301003", "passcode": ""})
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Members
# ---------------------------------------------------------------------------

def test_get_members_requires_auth():
    r = client.get("/members")
    assert r.status_code == 401


def test_get_members_returns_all():
    r = client.get("/members", headers=_auth())
    assert r.status_code == 200
    members = r.json()
    assert len(members) == 12
    assert members[0]["memberNumber"] == "8301001"
    assert "passcode" not in members[0]


def test_get_member_by_id():
    r = client.get("/members/8301001", headers=_auth())
    assert r.status_code == 200
    m = r.json()
    assert m["firstName"] == "James"
    assert m["lastName"] == "Huckestein"
    assert m["officerPosition"] == "Deputy Grand Knight"


def test_get_member_by_id_not_found():
    r = client.get("/members/9999999", headers=_auth())
    assert r.status_code == 404


def test_update_member_contact_info():
    r = client.put(
        "/members/8301004",
        headers=_non_officer_auth(),
        json={
            "addressStreet": "999 New St",
            "addressCity": "Dallas",
            "addressState": "TX",
            "addressZip": "75201",
            "phone": "214-555-9999",
            "email": "mark.new@example.com",
        },
    )
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert "message" in r.json()
    # Verify the update persisted
    m = client.get("/members/8301004", headers=_auth()).json()
    assert m["addressStreet"] == "999 New St"
    assert m["addressCity"] == "Dallas"
    assert m["email"] == "mark.new@example.com"


def test_update_member_not_found():
    r = client.put(
        "/members/9999999",
        headers=_auth(),
        json={
            "addressStreet": "x", "addressCity": "x", "addressState": "TX",
            "addressZip": "75000", "phone": "000", "email": "x@x.com",
        },
    )
    assert r.status_code == 404


def test_update_member_persists_within_session():
    client.put(
        "/members/8301004",
        headers=_non_officer_auth(),
        json={
            "addressStreet": "42 Changed Rd",
            "addressCity": "Plano",
            "addressState": "TX",
            "addressZip": "75023",
            "phone": "972-555-0001",
            "email": "changed@example.com",
        },
    )
    r = client.get("/members/8301004", headers=_auth())
    assert r.json()["addressStreet"] == "42 Changed Rd"


# ---------------------------------------------------------------------------
# Birthdays
# ---------------------------------------------------------------------------

def test_get_birthdays_requires_auth():
    r = client.get("/members/birthdays")
    assert r.status_code == 401


def test_get_birthdays_returns_list():
    r = client.get("/members/birthdays", headers=_auth())
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------------------------------------------------------------------------
# Prayer requests
# ---------------------------------------------------------------------------

def test_get_prayer_requests_requires_auth():
    r = client.get("/prayer-requests")
    assert r.status_code == 401


def test_get_prayer_requests_returns_seed_data():
    r = client.get("/prayer-requests", headers=_auth())
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 5
    assert items[0]["id"] == "a1b2c3d4-0001-0000-0000-000000000001"
    assert "text" in items[0]


def test_create_prayer_request():
    r = client.post(
        "/prayer-requests",
        headers=_auth(),
        json={"text": "Prayers for our community."},
    )
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert "message" in r.json()

    # Confirm it appears in the list
    r2 = client.get("/prayer-requests", headers=_auth())
    assert len(r2.json()) == 6
    assert any(item["text"] == "Prayers for our community." for item in r2.json())


def test_create_prayer_request_rejects_too_long_text():
    r = client.post(
        "/prayer-requests",
        headers=_auth(),
        json={"text": "x" * 1001},
    )
    assert r.status_code == 422


def test_create_prayer_request_rejects_empty_text():
    r = client.post(
        "/prayer-requests",
        headers=_auth(),
        json={"text": ""},
    )
    assert r.status_code == 422


def test_create_prayer_request_accepts_max_length_text():
    r = client.post(
        "/prayer-requests",
        headers=_auth(),
        json={"text": "x" * 1000},
    )
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_delete_prayer_request_by_owner():
    target_id = "a1b2c3d4-0001-0000-0000-000000000001"  # submitted_by 8301004
    r = client.delete(f"/prayer-requests/{target_id}", headers=_auth("8301004", "hope830"))
    assert r.status_code == 200
    assert r.json()["success"] is True
    listing = client.get("/prayer-requests", headers=_auth()).json()
    assert all(item["id"] != target_id for item in listing)
    assert len(listing) == 4


def test_delete_prayer_request_not_found():
    r = client.delete("/prayer-requests/no-such-id", headers=_auth())
    assert r.status_code == 404


def test_delete_prayer_request_forbidden_for_non_owner_non_officer():
    # request id ...0002 was submitted by 8301006; 8301004 (hope830) is a non-officer member
    target_id = "a1b2c3d4-0002-0000-0000-000000000002"
    r = client.delete(f"/prayer-requests/{target_id}", headers=_non_officer_auth())
    assert r.status_code == 403
    listing = client.get("/prayer-requests", headers=_auth()).json()
    assert any(item["id"] == target_id for item in listing)


def test_delete_prayer_request_allowed_for_officer_on_other_members_request():
    # request id ...0001 was submitted by 8301004; 8301002 is Grand Knight (officer)
    target_id = "a1b2c3d4-0001-0000-0000-000000000001"
    r = client.delete(f"/prayer-requests/{target_id}", headers=_officer_auth())
    assert r.status_code == 200
    assert r.json()["success"] is True
    listing = client.get("/prayer-requests", headers=_auth()).json()
    assert all(item["id"] != target_id for item in listing)


def test_delete_prayer_request_requires_auth():
    r = client.delete("/prayer-requests/a1b2c3d4-0001-0000-0000-000000000001")
    assert r.status_code in (401, 403)


def test_public_prayer_requests_no_auth_required():
    r = client.get("/prayer-requests/public")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 5
    for item in items:
        assert set(item.keys()) == {"id", "text", "submittedAt"}
        assert "submittedBy" not in item


def test_public_prayer_requests_reflects_deletes():
    target_id = "a1b2c3d4-0001-0000-0000-000000000001"
    client.delete(f"/prayer-requests/{target_id}", headers=_auth("8301004", "hope830"))
    public = client.get("/prayer-requests/public").json()
    assert all(item["id"] != target_id for item in public)
    assert len(public) == 4


# ---------------------------------------------------------------------------
# Meeting minutes
# ---------------------------------------------------------------------------

def test_get_meeting_minutes_requires_auth():
    r = client.get("/meeting-minutes")
    assert r.status_code == 401


def test_get_meeting_minutes_returns_seed_data():
    r = client.get("/meeting-minutes", headers=_auth())
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 4
    assert items[0]["title"] == "Council Business Meeting - April 2026"
    assert "s3Key" in items[0]


def test_get_meeting_minutes_detail():
    r = client.get("/meeting-minutes/b2c3d4e5-0001-0000-0000-000000000001", headers=_auth())
    assert r.status_code == 200
    item = r.json()
    assert item["title"] == "Council Business Meeting - April 2026"
    assert "url" in item


def test_get_meeting_minutes_detail_not_found():
    r = client.get("/meeting-minutes/no-such-id", headers=_auth())
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Email officer
# ---------------------------------------------------------------------------

def test_email_officer_stub():
    r = client.post(
        "/emails/officer",
        headers=_auth(),
        json={"officerTitle": "Grand Knight", "message": "Hello"},
    )
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_email_officer_not_found():
    r = client.post(
        "/emails/officer",
        headers=_auth(),
        json={"officerTitle": "No Such Title", "message": "Hello"},
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Nominations
# ---------------------------------------------------------------------------

def test_nominations_stub():
    r = client.post(
        "/nominations",
        headers=_auth(),
        json={"knightOfMonth": "John Smith", "familyOfMonth": "Smith Family"},
    )
    assert r.status_code == 200
    assert r.json()["success"] is True


# ---------------------------------------------------------------------------
# Officer-only endpoints
# ---------------------------------------------------------------------------

def test_email_all_members_requires_officer():
    r = client.post(
        "/emails/all-members",
        headers=_non_officer_auth(),
        json={"message": "Hello everyone"},
    )
    assert r.status_code == 403


def test_email_all_members_officer_succeeds():
    r = client.post(
        "/emails/all-members",
        headers=_officer_auth(),
        json={"message": "Hello everyone"},
    )
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_export_csv_requires_officer():
    r = client.get("/members/export-csv", headers=_non_officer_auth())
    assert r.status_code == 403


def test_export_csv_officer_returns_csv():
    r = client.get("/members/export-csv", headers=_officer_auth())
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    lines = r.text.strip().splitlines()
    assert lines[0].startswith("memberNumber")
    assert len(lines) == 13  # header + 12 members


def test_export_csv_contains_member_data():
    r = client.get("/members/export-csv", headers=_officer_auth())
    assert "Huckestein" in r.text
    assert "Akers" in r.text


# ---------------------------------------------------------------------------
# Events (calendar)
# ---------------------------------------------------------------------------

def _event_payload(**overrides) -> dict:
    base = {
        "day": "2026-05-13",
        "title": "Test Event",
        "description": "A test event.",
        "timeOfDay": "19:00",
        "location": "Parish Hall",
    }
    base.update(overrides)
    return base


def test_get_events_no_auth_required():
    r = client.get("/events")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 3
    keys = {"id", "day", "title", "description", "timeOfDay", "location", "createdBy", "createdAt", "updatedAt"}
    assert set(items[0].keys()) == keys


def test_get_events_filter_by_month():
    r = client.get("/events?month=2026-05")
    assert r.status_code == 200
    assert len(r.json()) == 3
    r2 = client.get("/events?month=2026-04")
    assert r2.status_code == 200
    assert r2.json() == []


def test_get_events_invalid_month_format():
    r = client.get("/events?month=2026/05")
    assert r.status_code == 400


def test_create_event_officer_succeeds():
    r = client.post("/events", headers=_officer_auth(), json=_event_payload())
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert "id" in body
    listing = client.get("/events").json()
    assert any(e["title"] == "Test Event" for e in listing)


def test_create_event_non_officer_forbidden():
    r = client.post("/events", headers=_non_officer_auth(), json=_event_payload())
    assert r.status_code == 403


def test_create_event_requires_auth():
    r = client.post("/events", json=_event_payload())
    assert r.status_code in (401, 403)


def test_create_event_rejects_invalid_day_format():
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(day="May 13 2026"))
    assert r.status_code == 422


def test_create_event_rejects_invalid_time_format():
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(timeOfDay="7pm"))
    assert r.status_code == 422


def test_create_event_rejects_nonexistent_calendar_date():
    """B2: regex shape passes but Feb 30 isn't a real date."""
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(day="2026-02-30"))
    assert r.status_code == 422


def test_create_event_rejects_month_13():
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(day="2026-13-01"))
    assert r.status_code == 422


def test_create_event_rejects_hour_out_of_range():
    """B2: regex shape passes but 25:00 is not a valid time."""
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(timeOfDay="25:00"))
    assert r.status_code == 422


def test_create_event_rejects_minute_out_of_range():
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(timeOfDay="12:99"))
    assert r.status_code == 422


def test_update_event_rejects_nonexistent_calendar_date():
    target_id = "c3d4e5f6-0001-0000-0000-000000000001"
    r = client.put(
        f"/events/{target_id}",
        headers=_officer_auth(),
        json=_event_payload(day="2026-02-30"),
    )
    assert r.status_code == 422


def test_update_event_rejects_invalid_time():
    target_id = "c3d4e5f6-0001-0000-0000-000000000001"
    r = client.put(
        f"/events/{target_id}",
        headers=_officer_auth(),
        json=_event_payload(timeOfDay="24:00"),
    )
    assert r.status_code == 422


def test_create_event_rejects_title_too_long():
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(title="x" * 201))
    assert r.status_code == 422


def test_create_event_rejects_description_too_long():
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(description="x" * 2001))
    assert r.status_code == 422


def test_create_event_rejects_location_too_long():
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(location="x" * 201))
    assert r.status_code == 422


def test_create_event_blocks_fourth_event_on_same_day():
    # Day starts empty (no seed events on 2026-05-13). Add three OK, then 4th must 409.
    for i in range(3):
        r = client.post("/events", headers=_officer_auth(), json=_event_payload(title=f"Event {i}"))
        assert r.status_code == 200
    r4 = client.post("/events", headers=_officer_auth(), json=_event_payload(title="Fourth"))
    assert r4.status_code == 409


def test_update_event_officer_succeeds():
    target_id = "c3d4e5f6-0001-0000-0000-000000000001"
    r = client.put(
        f"/events/{target_id}",
        headers=_officer_auth(),
        json=_event_payload(day="2026-05-06", title="Updated Title", description="Updated."),
    )
    assert r.status_code == 200
    assert r.json()["success"] is True
    listing = client.get("/events").json()
    found = next(e for e in listing if e["id"] == target_id)
    assert found["title"] == "Updated Title"
    assert found["description"] == "Updated."


def test_update_event_non_officer_forbidden():
    target_id = "c3d4e5f6-0001-0000-0000-000000000001"
    r = client.put(f"/events/{target_id}", headers=_non_officer_auth(), json=_event_payload())
    assert r.status_code == 403


def test_update_event_not_found():
    r = client.put("/events/no-such-id", headers=_officer_auth(), json=_event_payload())
    assert r.status_code == 404


def test_update_event_to_full_day_returns_409():
    # Fill 2026-05-13 with 3 events, then try to move the seed event from 2026-05-06 onto it.
    for i in range(3):
        client.post("/events", headers=_officer_auth(), json=_event_payload(title=f"Filler {i}"))
    seed_id = "c3d4e5f6-0001-0000-0000-000000000001"
    r = client.put(
        f"/events/{seed_id}",
        headers=_officer_auth(),
        json=_event_payload(day="2026-05-13", title="Bumped"),
    )
    assert r.status_code == 409


def test_delete_event_officer_succeeds():
    target_id = "c3d4e5f6-0002-0000-0000-000000000002"
    r = client.delete(f"/events/{target_id}", headers=_officer_auth())
    assert r.status_code == 200
    assert r.json()["success"] is True
    listing = client.get("/events").json()
    assert all(e["id"] != target_id for e in listing)


def test_delete_event_non_officer_forbidden():
    target_id = "c3d4e5f6-0002-0000-0000-000000000002"
    r = client.delete(f"/events/{target_id}", headers=_non_officer_auth())
    assert r.status_code == 403


def test_delete_event_not_found():
    r = client.delete("/events/no-such-id", headers=_officer_auth())
    assert r.status_code == 404


def test_update_event_requires_auth():
    r = client.put("/events/c3d4e5f6-0001-0000-0000-000000000001", json=_event_payload())
    assert r.status_code in (401, 403)


def test_delete_event_requires_auth():
    r = client.delete("/events/c3d4e5f6-0001-0000-0000-000000000001")
    assert r.status_code in (401, 403)


def test_event_full_lifecycle():
    """POST → GET → PUT → GET → DELETE → GET against the live in-memory store."""
    # Seed has 3 events
    assert len(client.get("/events").json()) == 3

    # Create
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(title="LC1"))
    assert r.status_code == 200
    new_id = r.json()["id"]

    # GET sees the new one
    listing = client.get("/events").json()
    assert len(listing) == 4
    new_record = next(e for e in listing if e["id"] == new_id)
    assert new_record["title"] == "LC1"
    assert new_record["createdBy"] == "8301002"
    assert new_record["createdAt"] == new_record["updatedAt"]

    # Update
    r2 = client.put(
        f"/events/{new_id}",
        headers=_officer_auth(),
        json=_event_payload(title="LC2", description="Updated body."),
    )
    assert r2.status_code == 200

    # GET sees the update
    listing2 = client.get("/events").json()
    updated = next(e for e in listing2 if e["id"] == new_id)
    assert updated["title"] == "LC2"
    assert updated["description"] == "Updated body."

    # Delete
    r3 = client.delete(f"/events/{new_id}", headers=_officer_auth())
    assert r3.status_code == 200

    # GET no longer contains
    listing3 = client.get("/events").json()
    assert all(e["id"] != new_id for e in listing3)
    assert len(listing3) == 3


def test_create_event_populates_audit_fields_from_jwt_and_today(monkeypatch):
    from datetime import date as date_cls

    from app import main

    monkeypatch.setattr(main, "_today", lambda: date_cls(2026, 5, 1))
    r = client.post("/events", headers=_officer_auth(), json=_event_payload(title="Audit"))
    assert r.status_code == 200
    new_id = r.json()["id"]
    record = next(e for e in client.get("/events").json() if e["id"] == new_id)
    assert record["createdBy"] == "8301002"
    assert record["createdAt"] == "2026-05-01T00:00:00Z"
    assert record["updatedAt"] == "2026-05-01T00:00:00Z"


def test_update_event_bumps_updated_at_but_not_created_at(monkeypatch):
    from datetime import date as date_cls

    from app import main

    monkeypatch.setattr(main, "_today", lambda: date_cls(2026, 5, 1))
    new_id = client.post("/events", headers=_officer_auth(), json=_event_payload(title="A")).json()["id"]

    monkeypatch.setattr(main, "_today", lambda: date_cls(2026, 5, 15))
    client.put(
        f"/events/{new_id}",
        headers=_officer_auth(),
        json=_event_payload(title="B"),
    )

    after = next(e for e in client.get("/events").json() if e["id"] == new_id)
    assert after["createdAt"] == "2026-05-01T00:00:00Z"
    assert after["updatedAt"] == "2026-05-15T00:00:00Z"


def test_create_event_max_3_under_concurrency(monkeypatch):
    """Regression for B1: even with a deliberately slow append (widening the
    check-and-insert window) and concurrent requests, the lock guarantees the
    max-3 invariant. Removing `_events_lock` from create_event should make this
    test fail."""
    import time
    from concurrent.futures import ThreadPoolExecutor

    from app import main as _main
    from app.seed import events_store as _orig_store

    class SlowAppendStore(list):
        def append(self, item):  # type: ignore[override]
            time.sleep(0.05)
            list.append(self, item)

    slow = SlowAppendStore(_orig_store)
    monkeypatch.setattr(_main, "events_store", slow)

    headers = _officer_auth()
    payload = _event_payload(day="2026-05-25")  # empty day in seed

    def fire():
        return client.post("/events", headers=headers, json=payload)

    with ThreadPoolExecutor(max_workers=5) as ex:
        results = [f.result() for f in [ex.submit(fire) for _ in range(5)]]

    statuses = [r.status_code for r in results]
    on_day = sum(1 for e in slow if e["day"] == "2026-05-25")
    assert on_day == 3, f"max-3 invariant violated; got {on_day} events, statuses={statuses}"
    assert statuses.count(200) == 3, statuses
    assert statuses.count(409) == 2, statuses


# ---------------------------------------------------------------------------
# Announcements (news)
# ---------------------------------------------------------------------------

def _announcement_payload(**overrides) -> dict:
    base = {
        "deleteDate": "2026-12-31",
        "title": "Test Announcement",
        "details": "A test announcement.",
    }
    base.update(overrides)
    return base


def _patch_today(monkeypatch, y: int, m: int, d: int) -> None:
    from datetime import date as _date

    from app import main as _main

    monkeypatch.setattr(_main, "_today", lambda: _date(y, m, d))


def test_get_announcements_no_auth_required():
    r = client.get("/announcements")
    assert r.status_code == 200


def test_get_announcements_returns_seed_camelcase_shape(monkeypatch):
    # Pin _today before the seed's earliest delete_date so all 3 are visible
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.get("/announcements")
    items = r.json()
    assert len(items) == 3
    keys = {"id", "title", "details", "deleteDate", "createdBy", "createdAt", "updatedAt"}
    assert set(items[0].keys()) == keys


def test_get_announcements_sorted_newest_first(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    items = client.get("/announcements").json()
    titles = [a["title"] for a in items]
    # Seed created_at order: 0003 (May 20) > 0002 (May 10) > 0001 (May 1)
    assert titles == [
        "New Member Welcome Reception",
        "Volunteer Sign-Up for Parish Festival",
        "Spring Charity Dinner",
    ]


def test_get_announcements_filters_expired_by_today(monkeypatch):
    # Seed 0001 has delete_date 2026-05-31. Pinning today to 2026-06-01 should drop it.
    _patch_today(monkeypatch, 2026, 6, 1)
    items = client.get("/announcements").json()
    assert len(items) == 2
    assert all(a["title"] != "Spring Charity Dinner" for a in items)


def test_get_announcements_boundary_delete_date_today_is_visible(monkeypatch):
    # delete_date == today → still visible
    _patch_today(monkeypatch, 2026, 5, 31)
    items = client.get("/announcements").json()
    assert any(a["title"] == "Spring Charity Dinner" for a in items)


def test_create_announcement_officer_succeeds(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.post("/announcements", headers=_officer_auth(), json=_announcement_payload())
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert "id" in body
    listing = client.get("/announcements").json()
    assert any(a["title"] == "Test Announcement" for a in listing)


def test_create_announcement_non_officer_forbidden(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.post("/announcements", headers=_non_officer_auth(), json=_announcement_payload())
    assert r.status_code == 403


def test_create_announcement_requires_auth(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.post("/announcements", json=_announcement_payload())
    assert r.status_code in (401, 403)


def test_create_announcement_rejects_invalid_date_format(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.post("/announcements", headers=_officer_auth(), json=_announcement_payload(deleteDate="June 1 2026"))
    assert r.status_code == 422


def test_create_announcement_rejects_nonexistent_calendar_date(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.post("/announcements", headers=_officer_auth(), json=_announcement_payload(deleteDate="2026-02-30"))
    assert r.status_code == 422


def test_create_announcement_rejects_past_delete_date(monkeypatch):
    _patch_today(monkeypatch, 2026, 6, 1)
    r = client.post("/announcements", headers=_officer_auth(), json=_announcement_payload(deleteDate="2026-05-31"))
    assert r.status_code == 422


def test_create_announcement_accepts_today_as_delete_date(monkeypatch):
    _patch_today(monkeypatch, 2026, 6, 1)
    r = client.post("/announcements", headers=_officer_auth(), json=_announcement_payload(deleteDate="2026-06-01"))
    assert r.status_code == 200


def test_create_announcement_rejects_title_too_long(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.post("/announcements", headers=_officer_auth(), json=_announcement_payload(title="x" * 201))
    assert r.status_code == 422


def test_create_announcement_rejects_details_too_long(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.post("/announcements", headers=_officer_auth(), json=_announcement_payload(details="x" * 2001))
    assert r.status_code == 422


def test_create_announcement_rejects_empty_title(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.post("/announcements", headers=_officer_auth(), json=_announcement_payload(title=""))
    assert r.status_code == 422


def test_create_announcement_rejects_empty_details(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.post("/announcements", headers=_officer_auth(), json=_announcement_payload(details=""))
    assert r.status_code == 422


def test_update_announcement_officer_succeeds(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    target_id = "d4e5f6a7-0001-0000-0000-000000000001"
    r = client.put(
        f"/announcements/{target_id}",
        headers=_officer_auth(),
        json=_announcement_payload(title="Updated", details="Updated details.", deleteDate="2026-08-01"),
    )
    assert r.status_code == 200
    listing = client.get("/announcements").json()
    found = next(a for a in listing if a["id"] == target_id)
    assert found["title"] == "Updated"
    assert found["details"] == "Updated details."
    assert found["deleteDate"] == "2026-08-01"


def test_update_announcement_non_officer_forbidden(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    target_id = "d4e5f6a7-0001-0000-0000-000000000001"
    r = client.put(f"/announcements/{target_id}", headers=_non_officer_auth(), json=_announcement_payload())
    assert r.status_code == 403


def test_update_announcement_requires_auth(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    target_id = "d4e5f6a7-0001-0000-0000-000000000001"
    r = client.put(f"/announcements/{target_id}", json=_announcement_payload())
    assert r.status_code in (401, 403)


def test_update_announcement_not_found(monkeypatch):
    _patch_today(monkeypatch, 2026, 5, 1)
    r = client.put("/announcements/no-such-id", headers=_officer_auth(), json=_announcement_payload())
    assert r.status_code == 404


def test_update_announcement_rejects_past_delete_date(monkeypatch):
    _patch_today(monkeypatch, 2026, 6, 1)
    target_id = "d4e5f6a7-0002-0000-0000-000000000002"
    r = client.put(
        f"/announcements/{target_id}",
        headers=_officer_auth(),
        json=_announcement_payload(deleteDate="2026-05-31"),
    )
    assert r.status_code == 422


def test_delete_announcement_officer_succeeds():
    target_id = "d4e5f6a7-0002-0000-0000-000000000002"
    r = client.delete(f"/announcements/{target_id}", headers=_officer_auth())
    assert r.status_code == 200
    listing = client.get("/announcements").json()
    assert all(a["id"] != target_id for a in listing)


def test_delete_announcement_non_officer_forbidden():
    target_id = "d4e5f6a7-0002-0000-0000-000000000002"
    r = client.delete(f"/announcements/{target_id}", headers=_non_officer_auth())
    assert r.status_code == 403


def test_delete_announcement_not_found():
    r = client.delete("/announcements/no-such-id", headers=_officer_auth())
    assert r.status_code == 404


def test_delete_announcement_requires_auth():
    target_id = "d4e5f6a7-0002-0000-0000-000000000002"
    r = client.delete(f"/announcements/{target_id}")
    assert r.status_code in (401, 403)


def test_announcements_concurrent_post_no_lost_writes(monkeypatch):
    """Mirrors the events concurrency test: 5 concurrent POSTs all succeed with
    unique ids and the store ends up with the expected count. Demonstrates the
    lock prevents lost appends under the slow-append shim."""
    import time
    from concurrent.futures import ThreadPoolExecutor

    from app import main as _main
    from app.seed import announcements_store as _orig_store

    _patch_today(monkeypatch, 2026, 5, 1)

    class SlowAppendStore(list):
        def append(self, item):  # type: ignore[override]
            time.sleep(0.05)
            list.append(self, item)

    slow = SlowAppendStore(_orig_store)
    monkeypatch.setattr(_main, "announcements_store", slow)

    headers = _officer_auth()
    payload = _announcement_payload()

    def fire():
        return client.post("/announcements", headers=headers, json=payload)

    with ThreadPoolExecutor(max_workers=5) as ex:
        results = [f.result() for f in [ex.submit(fire) for _ in range(5)]]

    statuses = [r.status_code for r in results]
    new_ids = {r.json()["id"] for r in results if r.status_code == 200}
    assert statuses.count(200) == 5, statuses
    assert len(new_ids) == 5, "expected 5 distinct ids"
    # Seed had 3 + 5 newly created = 8
    assert len(slow) == 8


def test_announcement_full_lifecycle(monkeypatch):
    """POST → GET → PUT → GET → DELETE → GET against the live in-memory store."""
    _patch_today(monkeypatch, 2026, 5, 1)

    # Seed has 3 active announcements
    assert len(client.get("/announcements").json()) == 3

    # Create
    r = client.post(
        "/announcements",
        headers=_officer_auth(),
        json=_announcement_payload(title="LC1", deleteDate="2026-09-01"),
    )
    assert r.status_code == 200
    new_id = r.json()["id"]

    # GET sees the new one (and it sorts to the top since it's newest)
    listing = client.get("/announcements").json()
    assert len(listing) == 4
    new_record = next(a for a in listing if a["id"] == new_id)
    assert new_record["title"] == "LC1"
    assert new_record["deleteDate"] == "2026-09-01"
    assert new_record["createdBy"] == "8301002"
    assert new_record["createdAt"] == new_record["updatedAt"]

    # Update
    r2 = client.put(
        f"/announcements/{new_id}",
        headers=_officer_auth(),
        json=_announcement_payload(title="LC2", details="Updated body.", deleteDate="2026-10-15"),
    )
    assert r2.status_code == 200

    # GET sees the update
    listing2 = client.get("/announcements").json()
    updated = next(a for a in listing2 if a["id"] == new_id)
    assert updated["title"] == "LC2"
    assert updated["details"] == "Updated body."
    assert updated["deleteDate"] == "2026-10-15"

    # Delete
    r3 = client.delete(f"/announcements/{new_id}", headers=_officer_auth())
    assert r3.status_code == 200

    # GET no longer contains
    listing3 = client.get("/announcements").json()
    assert all(a["id"] != new_id for a in listing3)
    assert len(listing3) == 3


def test_create_announcement_populates_audit_fields_from_jwt_and_today(monkeypatch):
    from datetime import date as date_cls

    from app import main as _main

    monkeypatch.setattr(_main, "_today", lambda: date_cls(2026, 5, 1))
    r = client.post(
        "/announcements",
        headers=_officer_auth(),
        json=_announcement_payload(title="Audit", deleteDate="2026-09-01"),
    )
    assert r.status_code == 200
    new_id = r.json()["id"]
    record = next(a for a in client.get("/announcements").json() if a["id"] == new_id)
    assert record["createdBy"] == "8301002"
    assert record["createdAt"] == "2026-05-01T00:00:00Z"
    assert record["updatedAt"] == "2026-05-01T00:00:00Z"


def test_update_announcement_preserves_created_by_and_created_at(monkeypatch):
    from datetime import date as date_cls

    from app import main as _main

    monkeypatch.setattr(_main, "_today", lambda: date_cls(2026, 5, 1))
    new_id = client.post(
        "/announcements",
        headers=_officer_auth(),
        json=_announcement_payload(title="A", deleteDate="2026-09-01"),
    ).json()["id"]

    monkeypatch.setattr(_main, "_today", lambda: date_cls(2026, 5, 15))
    # PUT as a different officer to ensure created_by isn't overwritten by the JWT sub
    r = client.put(
        f"/announcements/{new_id}",
        headers=_auth("8301001", "faith830"),  # Deputy Grand Knight, also an officer
        json=_announcement_payload(title="B", deleteDate="2026-10-15"),
    )
    assert r.status_code == 200

    after = next(a for a in client.get("/announcements").json() if a["id"] == new_id)
    assert after["createdBy"] == "8301002"  # original creator preserved
    assert after["createdAt"] == "2026-05-01T00:00:00Z"  # original timestamp preserved
    assert after["updatedAt"] == "2026-05-15T00:00:00Z"  # bumped to current _today


# ---------------------------------------------------------------------------
# Photos (gallery)
# ---------------------------------------------------------------------------

def _photo_payload(**overrides) -> dict:
    base = {
        "title": "Test Photo",
        "photoUrl": "/gallery/test-photo.jpg",
    }
    base.update(overrides)
    return base


def test_get_photos_no_auth_required():
    r = client.get("/photos")
    assert r.status_code == 200


def test_get_photos_returns_seed_camelcase_shape():
    r = client.get("/photos")
    items = r.json()
    assert len(items) == 2
    keys = {"id", "title", "photoUrl", "createdBy", "createdAt", "updatedAt"}
    assert set(items[0].keys()) == keys


def test_get_photos_sorted_oldest_first():
    items = client.get("/photos").json()
    titles = [p["title"] for p in items]
    # Seed created_at order: 0001 (Apr 10) < 0002 (Apr 22) so 0001 is first
    assert titles == ["Spring Charity Dinner 2026", "St. Patrick Day Service Project"]


def test_create_photo_officer_succeeds():
    r = client.post("/photos", headers=_officer_auth(), json=_photo_payload())
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["message"] == "Photo added."
    assert "id" in body
    listing = client.get("/photos").json()
    assert any(p["id"] == body["id"] for p in listing)


def test_create_photo_non_officer_forbidden():
    r = client.post("/photos", headers=_non_officer_auth(), json=_photo_payload())
    assert r.status_code == 403


def test_create_photo_requires_auth():
    r = client.post("/photos", json=_photo_payload())
    assert r.status_code in (401, 403)


def test_create_photo_rejects_empty_title():
    r = client.post("/photos", headers=_officer_auth(), json=_photo_payload(title=""))
    assert r.status_code == 422


def test_create_photo_rejects_whitespace_only_title():
    r = client.post("/photos", headers=_officer_auth(), json=_photo_payload(title="   "))
    assert r.status_code == 422


def test_create_photo_rejects_title_too_long():
    r = client.post("/photos", headers=_officer_auth(), json=_photo_payload(title="x" * 201))
    assert r.status_code == 422


def test_create_photo_rejects_empty_photo_url():
    r = client.post("/photos", headers=_officer_auth(), json=_photo_payload(photoUrl=""))
    assert r.status_code == 422


def test_create_photo_rejects_photo_url_too_long():
    r = client.post("/photos", headers=_officer_auth(), json=_photo_payload(photoUrl="x" * 2049))
    assert r.status_code == 422


def test_update_photo_officer_succeeds():
    target_id = "e5f6a7b8-0001-0000-0000-000000000001"
    r = client.put(
        f"/photos/{target_id}",
        headers=_officer_auth(),
        json=_photo_payload(title="Renamed", photoUrl="/gallery/renamed.png"),
    )
    assert r.status_code == 200
    listing = client.get("/photos").json()
    updated = next(p for p in listing if p["id"] == target_id)
    assert updated["title"] == "Renamed"
    assert updated["photoUrl"] == "/gallery/renamed.png"


def test_update_photo_non_officer_forbidden():
    target_id = "e5f6a7b8-0001-0000-0000-000000000001"
    r = client.put(f"/photos/{target_id}", headers=_non_officer_auth(), json=_photo_payload())
    assert r.status_code == 403


def test_update_photo_not_found():
    r = client.put("/photos/no-such-id", headers=_officer_auth(), json=_photo_payload())
    assert r.status_code == 404


def test_update_photo_rejects_invalid_body():
    target_id = "e5f6a7b8-0001-0000-0000-000000000001"
    r = client.put(f"/photos/{target_id}", headers=_officer_auth(), json={"title": "only-title"})
    assert r.status_code == 422


def test_delete_photo_officer_succeeds():
    target_id = "e5f6a7b8-0001-0000-0000-000000000001"
    r = client.delete(f"/photos/{target_id}", headers=_officer_auth())
    assert r.status_code == 200
    listing = client.get("/photos").json()
    assert all(p["id"] != target_id for p in listing)


def test_delete_photo_non_officer_forbidden():
    target_id = "e5f6a7b8-0001-0000-0000-000000000001"
    r = client.delete(f"/photos/{target_id}", headers=_non_officer_auth())
    assert r.status_code == 403


def test_delete_photo_not_found():
    r = client.delete("/photos/no-such-id", headers=_officer_auth())
    assert r.status_code == 404


def test_delete_photo_requires_auth():
    target_id = "e5f6a7b8-0001-0000-0000-000000000001"
    r = client.delete(f"/photos/{target_id}")
    assert r.status_code in (401, 403)


def test_photos_concurrent_post_no_lost_writes(monkeypatch):
    """5 concurrent POSTs all succeed with unique ids and the store ends up with
    the expected count. Demonstrates the lock prevents lost appends under the
    slow-append shim."""
    import time
    from concurrent.futures import ThreadPoolExecutor

    from app import main as _main
    from app.seed import photos_store as _orig_store

    class SlowAppendStore(list):
        def append(self, item):  # type: ignore[override]
            time.sleep(0.05)
            list.append(self, item)

    slow = SlowAppendStore(_orig_store)
    monkeypatch.setattr(_main, "photos_store", slow)

    headers = _officer_auth()
    payload = _photo_payload()

    def fire():
        return client.post("/photos", headers=headers, json=payload)

    with ThreadPoolExecutor(max_workers=5) as ex:
        results = [f.result() for f in [ex.submit(fire) for _ in range(5)]]

    statuses = [r.status_code for r in results]
    new_ids = {r.json()["id"] for r in results if r.status_code == 200}
    assert statuses.count(200) == 5, statuses
    assert len(new_ids) == 5, "expected 5 distinct ids"
    # Seed had 2 + 5 newly created = 7
    assert len(slow) == 7


def test_photo_full_lifecycle(monkeypatch):
    """POST → GET → PUT → GET → DELETE → GET against the live in-memory store."""
    from app import main as _main

    monkeypatch.setattr(_main, "_now_iso_precise", lambda: "2026-05-01T10:00:00Z")

    # Seed has 2 photos
    assert len(client.get("/photos").json()) == 2

    # Create
    r = client.post(
        "/photos",
        headers=_officer_auth(),
        json=_photo_payload(title="LC1", photoUrl="/gallery/lc1.jpg"),
    )
    assert r.status_code == 200
    new_id = r.json()["id"]

    # GET sees the new one (sorts to the bottom — newest is last)
    listing = client.get("/photos").json()
    assert len(listing) == 3
    assert listing[-1]["id"] == new_id
    assert listing[-1]["title"] == "LC1"
    assert listing[-1]["photoUrl"] == "/gallery/lc1.jpg"
    assert listing[-1]["createdBy"] == "8301002"
    assert listing[-1]["createdAt"] == listing[-1]["updatedAt"]

    # Update
    r2 = client.put(
        f"/photos/{new_id}",
        headers=_officer_auth(),
        json=_photo_payload(title="LC2", photoUrl="/gallery/lc2.jpg"),
    )
    assert r2.status_code == 200

    # GET sees the update
    listing2 = client.get("/photos").json()
    updated = next(p for p in listing2 if p["id"] == new_id)
    assert updated["title"] == "LC2"
    assert updated["photoUrl"] == "/gallery/lc2.jpg"

    # Delete
    r3 = client.delete(f"/photos/{new_id}", headers=_officer_auth())
    assert r3.status_code == 200

    # GET no longer contains
    listing3 = client.get("/photos").json()
    assert all(p["id"] != new_id for p in listing3)
    assert len(listing3) == 2


def test_create_photo_populates_audit_fields_from_jwt_and_now(monkeypatch):
    from app import main as _main

    monkeypatch.setattr(_main, "_now_iso_precise", lambda: "2026-05-01T09:30:00Z")
    r = client.post(
        "/photos",
        headers=_officer_auth(),
        json=_photo_payload(title="Audit"),
    )
    assert r.status_code == 200
    new_id = r.json()["id"]
    record = next(p for p in client.get("/photos").json() if p["id"] == new_id)
    assert record["createdBy"] == "8301002"
    assert record["createdAt"] == "2026-05-01T09:30:00Z"
    assert record["updatedAt"] == "2026-05-01T09:30:00Z"


def test_update_photo_preserves_created_by_and_created_at(monkeypatch):
    from app import main as _main

    monkeypatch.setattr(_main, "_now_iso_precise", lambda: "2026-05-01T09:30:00Z")
    new_id = client.post(
        "/photos",
        headers=_officer_auth(),
        json=_photo_payload(title="A"),
    ).json()["id"]

    monkeypatch.setattr(_main, "_now_iso_precise", lambda: "2026-05-15T14:45:00Z")
    # PUT as a different officer to ensure created_by isn't overwritten by the JWT sub
    r = client.put(
        f"/photos/{new_id}",
        headers=_auth("8301001", "faith830"),  # Deputy Grand Knight, also an officer
        json=_photo_payload(title="B"),
    )
    assert r.status_code == 200

    after = next(p for p in client.get("/photos").json() if p["id"] == new_id)
    assert after["createdBy"] == "8301002"  # original creator preserved
    assert after["createdAt"] == "2026-05-01T09:30:00Z"  # original timestamp preserved
    assert after["updatedAt"] == "2026-05-15T14:45:00Z"  # bumped to current time


def test_get_photos_same_day_sorted_by_insertion_order(monkeypatch):
    """Photos created in the same day must appear oldest-first by insertion
    order, not by random UUID tiebreaker. Regression test for the date-only
    `_now_iso()` bug where every same-day record shared `T00:00:00Z` and the
    sort fell back to a random `id`."""
    from app import main as _main

    # Three creates on the same day, each at a distinct second.
    timestamps = iter([
        "2026-06-01T08:00:00Z",
        "2026-06-01T08:00:01Z",
        "2026-06-01T08:00:02Z",
    ])
    monkeypatch.setattr(_main, "_now_iso_precise", lambda: next(timestamps))

    for title in ("Alpha", "Bravo", "Charlie"):
        r = client.post("/photos", headers=_officer_auth(), json=_photo_payload(title=title))
        assert r.status_code == 200

    listing = client.get("/photos").json()
    new_titles = [p["title"] for p in listing if p["title"] in {"Alpha", "Bravo", "Charlie"}]
    assert new_titles == ["Alpha", "Bravo", "Charlie"]


def test_create_photo_trims_title_and_photo_url():
    r = client.post(
        "/photos",
        headers=_officer_auth(),
        json=_photo_payload(title="  Padded  ", photoUrl="  /gallery/padded.jpg  "),
    )
    assert r.status_code == 200
    new_id = r.json()["id"]
    record = next(p for p in client.get("/photos").json() if p["id"] == new_id)
    assert record["title"] == "Padded"
    assert record["photoUrl"] == "/gallery/padded.jpg"

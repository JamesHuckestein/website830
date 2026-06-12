"""DynamoDB-specific integration tests.

Tests conditional writes, max-3-per-day enforcement, officer assignment
atomicity, and duplicate member prevention — behaviors that rely on
DynamoDB semantics rather than in-memory locks.
"""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repos import events as events_repo
from app.repos import members as members_repo
from app.repos import officers as officers_repo

client = TestClient(app)


def _token(member_number: str, passcode: str) -> str:
    r = client.post("/auth/login", json={"membershipNumber": member_number, "passcode": passcode})
    assert r.status_code == 200
    return r.json()["token"]


def _officer_auth() -> dict:
    return {"Authorization": f"Bearer {_token('8301002', 'charity830')}"}


def _privileged_auth() -> dict:
    return _officer_auth()


# ---------------------------------------------------------------------------
# Conditional write: prevent duplicate member_number
# ---------------------------------------------------------------------------

def test_create_member_conditional_write_prevents_duplicate():
    body = {
        "memberNumber": "8301001",
        "passcode": "duplicate",
        "firstName": "Dup",
        "lastName": "Member",
        "addressStreet": "1 St",
        "addressCity": "City",
        "addressState": "TX",
        "addressZip": "75000",
        "phone": "",
        "birthday": "1990-01-01",
        "email": "dup@example.com",
        "assemblyNumber": None,
        "firstDegreeDate": "2020-01-01",
        "secondDegreeDate": "2020-02-01",
        "thirdDegreeDate": "2020-03-01",
        "fourthDegreeDate": None,
    }
    r = client.post("/members", json=body, headers=_privileged_auth())
    assert r.status_code == 409
    assert "already exists" in r.json()["detail"]


def test_create_member_unique_succeeds():
    body = {
        "memberNumber": "8307777",
        "passcode": "newpass",
        "firstName": "Unique",
        "lastName": "Member",
        "addressStreet": "1 St",
        "addressCity": "City",
        "addressState": "TX",
        "addressZip": "75000",
        "phone": "",
        "birthday": "1990-01-01",
        "email": "unique@example.com",
        "assemblyNumber": None,
        "firstDegreeDate": "2020-01-01",
        "secondDegreeDate": "2020-02-01",
        "thirdDegreeDate": "2020-03-01",
        "fourthDegreeDate": None,
    }
    r = client.post("/members", json=body, headers=_privileged_auth())
    assert r.status_code == 201

    member = members_repo.get_by_number("8307777")
    assert member is not None
    assert member["first_name"] == "Unique"


# ---------------------------------------------------------------------------
# Max-3-per-day enforcement
# ---------------------------------------------------------------------------

def _event_payload(day: str = "2026-07-15") -> dict:
    return {
        "day": day,
        "title": "Test Event",
        "description": "Integration test event",
        "timeOfDay": "18:00",
        "location": "Hall",
    }


def test_max_3_events_per_day_enforced():
    day = "2026-08-20"
    headers = _officer_auth()

    r1 = client.post("/events", json=_event_payload(day), headers=headers)
    assert r1.status_code == 200

    r2 = client.post("/events", json=_event_payload(day), headers=headers)
    assert r2.status_code == 200

    r3 = client.post("/events", json=_event_payload(day), headers=headers)
    assert r3.status_code == 200

    r4 = client.post("/events", json=_event_payload(day), headers=headers)
    assert r4.status_code == 409
    assert "maximum of 3" in r4.json()["detail"]


def test_max_3_count_uses_gsi_query():
    day = "2026-09-10"
    headers = _officer_auth()

    assert events_repo.count_by_day(day) == 0

    client.post("/events", json=_event_payload(day), headers=headers)
    assert events_repo.count_by_day(day) == 1

    client.post("/events", json=_event_payload(day), headers=headers)
    assert events_repo.count_by_day(day) == 2


def test_event_update_day_change_respects_max_3():
    headers = _officer_auth()
    target_day = "2026-10-05"

    for _ in range(3):
        client.post("/events", json=_event_payload(target_day), headers=headers)

    other_day = "2026-10-06"
    r = client.post("/events", json=_event_payload(other_day), headers=headers)
    assert r.status_code == 200
    event_id = r.json()["id"]

    update_body = _event_payload(target_day)
    r = client.put(f"/events/{event_id}", json=update_body, headers=headers)
    assert r.status_code == 409
    assert "maximum of 3" in r.json()["detail"]


# ---------------------------------------------------------------------------
# Officer assignment consistency
# ---------------------------------------------------------------------------

def test_officer_swap_updates_member_positions():
    member = members_repo.get_by_number("8301002")
    assert member.get("officer_position") == "Grand Knight"

    officer = officers_repo.get_by_title("Grand Knight")
    assert officer["member_number"] == "8301002"
    assert "Akers" in officer["name"]


def test_officer_assignment_clears_old_member():
    import base64

    _VALID_PNG = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
        b"\r\n\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    old_member = "8301002"
    new_member = "8301015"

    body = {
        "memberNumber": new_member,
        "photoData": base64.b64encode(_VALID_PNG).decode(),
        "photoFilename": "new-gk.png",
    }
    r = client.put("/officers/Grand Knight", json=body, headers=_privileged_auth())
    assert r.status_code == 200

    old = members_repo.get_by_number(old_member)
    assert old.get("officer_position") is None

    new = members_repo.get_by_number(new_member)
    assert new.get("officer_position") == "Grand Knight"

    officer = officers_repo.get_by_title("Grand Knight")
    assert officer["member_number"] == new_member


def test_delete_member_clears_officer_slot():
    officer_member = "8301002"
    r = client.delete(f"/members/{officer_member}", headers=_privileged_auth())
    assert r.status_code == 200

    officer = officers_repo.get_by_title("Grand Knight")
    assert officer["name"] == "Vacant"
    assert officer.get("member_number") is None


# ---------------------------------------------------------------------------
# Prayer request ownership check via GetItem
# ---------------------------------------------------------------------------

def test_prayer_request_delete_owner_check():
    from app.repos import prayer_requests as prayer_requests_repo

    headers_creator = {"Authorization": f"Bearer {_token('8301002', 'charity830')}"}
    r = client.post("/prayer-requests", json={"text": "Test prayer"}, headers=headers_creator)
    assert r.status_code == 200

    requests = prayer_requests_repo.list_all()
    new_request = next(pr for pr in requests if pr["text"] == "Test prayer")

    # 8301015 is a non-officer member — should be forbidden from deleting others' requests
    headers_other = {"Authorization": f"Bearer {_token('8301015', 'hope830')}"}
    r = client.delete(f"/prayer-requests/{new_request['id']}", headers=headers_other)
    assert r.status_code == 403

    r = client.delete(f"/prayer-requests/{new_request['id']}", headers=headers_creator)
    assert r.status_code == 200


def test_prayer_request_officer_can_delete_others():
    headers_creator = {"Authorization": f"Bearer {_token('8301015', 'hope830')}"}
    r = client.post("/prayer-requests", json={"text": "Officer delete test"}, headers=headers_creator)
    assert r.status_code == 200

    from app.repos import prayer_requests as prayer_requests_repo
    requests = prayer_requests_repo.list_all()
    new_request = next(pr for pr in requests if pr["text"] == "Officer delete test")

    r = client.delete(f"/prayer-requests/{new_request['id']}", headers=_officer_auth())
    assert r.status_code == 200

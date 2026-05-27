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

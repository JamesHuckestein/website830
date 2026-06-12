import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repos import members as members_repo

client = TestClient(app)

_JWT_SECRET = "dev-secret-change-in-production!!"


def _token(member_number: str, passcode: str) -> str:
    r = client.post("/auth/login", json={"membershipNumber": member_number, "passcode": passcode})
    assert r.status_code == 200
    return r.json()["token"]


def _privileged_auth() -> dict:
    return {"Authorization": f"Bearer {_token('8301002', 'charity830')}"}


def _non_officer_auth() -> dict:
    return {"Authorization": f"Bearer {_token('8301015', 'hope830')}"}


def _non_privileged_officer_auth() -> dict:
    token = pyjwt.encode(
        {"sub": "8301003", "isOfficer": True, "officerPosition": "Chancellor"},
        _JWT_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


def _valid_create_body() -> dict:
    return {
        "memberNumber": "8309999",
        "passcode": "newpass123",
        "firstName": "New",
        "lastName": "Member",
        "addressStreet": "123 Test St",
        "addressCity": "TestCity",
        "addressState": "TX",
        "addressZip": "75000",
        "phone": "555-0199",
        "birthday": "1985-03-15",
        "email": "new@example.com",
        "assemblyNumber": None,
        "firstDegreeDate": "2020-01-10",
        "secondDegreeDate": "2020-03-10",
        "thirdDegreeDate": "2020-05-10",
        "fourthDegreeDate": None,
    }


# ---------------------------------------------------------------------------
# POST /members
# ---------------------------------------------------------------------------

def test_create_member_success():
    r = client.post("/members", json=_valid_create_body(), headers=_privileged_auth())
    assert r.status_code == 201
    data = r.json()
    assert data["success"] is True
    assert "added" in data["message"].lower()

    members_r = client.get("/members", headers=_privileged_auth())
    numbers = [m["memberNumber"] for m in members_r.json()]
    assert "8309999" in numbers


def test_create_member_duplicate_number():
    r = client.post("/members", json=_valid_create_body(), headers=_privileged_auth())
    assert r.status_code == 201

    r2 = client.post("/members", json=_valid_create_body(), headers=_privileged_auth())
    assert r2.status_code == 409


def test_create_member_missing_required_fields():
    body = _valid_create_body()
    del body["firstName"]
    r = client.post("/members", json=body, headers=_privileged_auth())
    assert r.status_code == 422


def test_create_member_invalid_member_number_format():
    body = _valid_create_body()
    body["memberNumber"] = "INVALID"
    r = client.post("/members", json=body, headers=_privileged_auth())
    assert r.status_code == 422


def test_create_member_invalid_date():
    body = _valid_create_body()
    body["birthday"] = "2026-02-30"
    r = client.post("/members", json=body, headers=_privileged_auth())
    assert r.status_code == 422


def test_create_member_forbidden_non_officer():
    r = client.post("/members", json=_valid_create_body(), headers=_non_officer_auth())
    assert r.status_code == 403


def test_create_member_forbidden_non_privileged_officer():
    r = client.post("/members", json=_valid_create_body(), headers=_non_privileged_officer_auth())
    assert r.status_code == 403


def test_create_member_unauthorized_no_token():
    r = client.post("/members", json=_valid_create_body())
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# PUT /members/{member_id}/full
# ---------------------------------------------------------------------------

def test_update_member_full_success():
    body = {
        "memberNumber": "8301015",
        "passcode": None,
        "firstName": "Tommy",
        "lastName": "Wilson",
        "addressStreet": "999 New St",
        "addressCity": "NewCity",
        "addressState": "TX",
        "addressZip": "75001",
        "phone": "555-9999",
        "birthday": "1990-11-03",
        "email": "tommy@example.com",
        "assemblyNumber": "1234",
        "firstDegreeDate": "2020-02-14",
        "secondDegreeDate": "2020-03-28",
        "thirdDegreeDate": "2020-06-12",
        "fourthDegreeDate": "2021-01-15",
    }
    r = client.put("/members/8301015/full", json=body, headers=_privileged_auth())
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True

    member_r = client.get("/members/8301015", headers=_privileged_auth())
    m = member_r.json()
    assert m["firstName"] == "Tommy"
    assert m["addressStreet"] == "999 New St"
    assert m["fourthDegreeDate"] == "2021-01-15"


def test_update_member_full_blank_passcode_no_change():
    original_passcode = members_repo.get_by_number("8301015")["passcode"]
    body = {
        "memberNumber": "8301015",
        "passcode": None,
        "firstName": "Thomas",
        "lastName": "Wilson",
        "addressStreet": "789 Dogwood Ct",
        "addressCity": "Denison",
        "addressState": "TX",
        "addressZip": "75020",
        "phone": "903-555-0115",
        "birthday": "1990-11-03",
        "email": "thomas.wilson@example.com",
        "assemblyNumber": None,
        "firstDegreeDate": "2020-02-14",
        "secondDegreeDate": "2020-03-28",
        "thirdDegreeDate": "2020-06-12",
        "fourthDegreeDate": None,
    }
    r = client.put("/members/8301015/full", json=body, headers=_privileged_auth())
    assert r.status_code == 200

    current_passcode = members_repo.get_by_number("8301015")["passcode"]
    assert current_passcode == original_passcode


def test_update_member_full_new_passcode():
    body = {
        "memberNumber": "8301015",
        "passcode": "newpassword",
        "firstName": "Thomas",
        "lastName": "Wilson",
        "addressStreet": "789 Dogwood Ct",
        "addressCity": "Denison",
        "addressState": "TX",
        "addressZip": "75020",
        "phone": "903-555-0115",
        "birthday": "1990-11-03",
        "email": "thomas.wilson@example.com",
        "assemblyNumber": None,
        "firstDegreeDate": "2020-02-14",
        "secondDegreeDate": "2020-03-28",
        "thirdDegreeDate": "2020-06-12",
        "fourthDegreeDate": None,
    }
    r = client.put("/members/8301015/full", json=body, headers=_privileged_auth())
    assert r.status_code == 200

    current_passcode = members_repo.get_by_number("8301015")["passcode"]
    assert current_passcode == "newpassword"


def test_update_member_full_not_found():
    body = {
        "memberNumber": "8309999",
        "passcode": None,
        "firstName": "Nobody",
        "lastName": "Here",
        "addressStreet": "1 St",
        "addressCity": "C",
        "addressState": "TX",
        "addressZip": "75000",
        "phone": "",
        "birthday": "1990-01-01",
        "email": "",
        "assemblyNumber": None,
        "firstDegreeDate": "2020-01-01",
        "secondDegreeDate": "2020-02-01",
        "thirdDegreeDate": "2020-03-01",
        "fourthDegreeDate": None,
    }
    r = client.put("/members/8309999/full", json=body, headers=_privileged_auth())
    assert r.status_code == 404


def test_update_member_full_conflict_on_number_change():
    body = {
        "memberNumber": "8301002",
        "passcode": None,
        "firstName": "Thomas",
        "lastName": "Wilson",
        "addressStreet": "789 Dogwood Ct",
        "addressCity": "Denison",
        "addressState": "TX",
        "addressZip": "75020",
        "phone": "903-555-0115",
        "birthday": "1990-11-03",
        "email": "thomas.wilson@example.com",
        "assemblyNumber": None,
        "firstDegreeDate": "2020-02-14",
        "secondDegreeDate": "2020-03-28",
        "thirdDegreeDate": "2020-06-12",
        "fourthDegreeDate": None,
    }
    r = client.put("/members/8301015/full", json=body, headers=_privileged_auth())
    assert r.status_code == 409


def test_update_member_full_forbidden_non_officer():
    body = {
        "memberNumber": "8301015",
        "passcode": None,
        "firstName": "Thomas",
        "lastName": "Wilson",
        "addressStreet": "789 Dogwood Ct",
        "addressCity": "Denison",
        "addressState": "TX",
        "addressZip": "75020",
        "phone": "903-555-0115",
        "birthday": "1990-11-03",
        "email": "thomas.wilson@example.com",
        "assemblyNumber": None,
        "firstDegreeDate": "2020-02-14",
        "secondDegreeDate": "2020-03-28",
        "thirdDegreeDate": "2020-06-12",
        "fourthDegreeDate": None,
    }
    r = client.put("/members/8301015/full", json=body, headers=_non_officer_auth())
    assert r.status_code == 403


def test_update_member_full_forbidden_non_privileged_officer():
    body = {
        "memberNumber": "8301015",
        "passcode": None,
        "firstName": "Thomas",
        "lastName": "Wilson",
        "addressStreet": "789 Dogwood Ct",
        "addressCity": "Denison",
        "addressState": "TX",
        "addressZip": "75020",
        "phone": "903-555-0115",
        "birthday": "1990-11-03",
        "email": "thomas.wilson@example.com",
        "assemblyNumber": None,
        "firstDegreeDate": "2020-02-14",
        "secondDegreeDate": "2020-03-28",
        "thirdDegreeDate": "2020-06-12",
        "fourthDegreeDate": None,
    }
    r = client.put("/members/8301015/full", json=body, headers=_non_privileged_officer_auth())
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# DELETE /members/{member_id}
# ---------------------------------------------------------------------------

def test_delete_member_success():
    r = client.delete("/members/8301015", headers=_privileged_auth())
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True

    members_r = client.get("/members", headers=_privileged_auth())
    numbers = [m["memberNumber"] for m in members_r.json()]
    assert "8301015" not in numbers


def test_delete_member_not_found():
    r = client.delete("/members/8309999", headers=_privileged_auth())
    assert r.status_code == 404


def test_delete_member_clears_officer_slot():
    officer_member = "8301002"
    r = client.delete(f"/members/{officer_member}", headers=_privileged_auth())
    assert r.status_code == 200

    officers_r = client.get("/officers")
    gk = next(o for o in officers_r.json() if o["title"] == "Grand Knight")
    assert gk["name"] == "Vacant"


def test_delete_member_forbidden_non_officer():
    r = client.delete("/members/8301015", headers=_non_officer_auth())
    assert r.status_code == 403


def test_delete_member_forbidden_non_privileged_officer():
    r = client.delete("/members/8301015", headers=_non_privileged_officer_auth())
    assert r.status_code == 403


def test_delete_member_unauthorized_no_token():
    r = client.delete("/members/8301015")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Admin account protection
# ---------------------------------------------------------------------------

def _admin_auth() -> dict:
    return {"Authorization": f"Bearer {_token('830999999', 'JesusisLord1!')}"}


def test_privileged_officer_cannot_delete_admin():
    r = client.delete("/members/830999999", headers=_privileged_auth())
    assert r.status_code == 403
    assert "admin" in r.json()["detail"].lower()


def test_privileged_officer_cannot_edit_admin():
    body = _valid_create_body()
    body["memberNumber"] = "8309999"
    r = client.put("/members/830999999/full", json=body, headers=_privileged_auth())
    assert r.status_code == 403
    assert "admin" in r.json()["detail"].lower()


def test_admin_can_create_member():
    r = client.post("/members", json=_valid_create_body(), headers=_admin_auth())
    assert r.status_code == 201


def test_admin_can_edit_regular_member():
    body = _valid_create_body()
    body["memberNumber"] = "8301015"
    r = client.put("/members/8301015/full", json=body, headers=_admin_auth())
    assert r.status_code == 200


def test_admin_can_delete_regular_member():
    r = client.delete("/members/8301015", headers=_admin_auth())
    assert r.status_code == 200


# ---------------------------------------------------------------------------
# Admin password endpoint
# ---------------------------------------------------------------------------

def test_admin_password_update_success():
    r = client.put("/admin/password", json={"passcode": "NewPass123!"}, headers=_admin_auth())
    assert r.status_code == 200
    assert r.json()["success"] is True
    # Verify new password works
    r2 = client.post("/auth/login", json={"membershipNumber": "830999999", "passcode": "NewPass123!"})
    assert r2.status_code == 200


def test_admin_password_update_old_password_fails_after_change():
    client.put("/admin/password", json={"passcode": "NewPass123!"}, headers=_admin_auth())
    r = client.post("/auth/login", json={"membershipNumber": "830999999", "passcode": "JesusisLord1!"})
    assert r.status_code == 401


def test_non_admin_cannot_update_admin_password():
    r = client.put("/admin/password", json={"passcode": "HackedPass!"}, headers=_privileged_auth())
    assert r.status_code == 403


def test_non_officer_cannot_update_admin_password():
    r = client.put("/admin/password", json={"passcode": "HackedPass!"}, headers=_non_officer_auth())
    assert r.status_code == 403

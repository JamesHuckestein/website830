import jwt as pyjwt
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_JWT_SECRET = "dev-secret-change-in-production!!"


def _token(member_number: str, passcode: str) -> str:
    r = client.post("/auth/login", json={"membershipNumber": member_number, "passcode": passcode})
    assert r.status_code == 200
    return r.json()["token"]


def _privileged_auth() -> dict:
    return {"Authorization": f"Bearer {_token('4897307', 'koc830')}"}


def _non_privileged_officer_auth() -> dict:
    token = pyjwt.encode(
        {"sub": "2486615", "isOfficer": True, "officerPosition": "Chancellor"},
        _JWT_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


def _non_officer_auth() -> dict:
    return {"Authorization": f"Bearer {_token('4606798', 'koc830')}"}


# --- Grant auxiliary officer ---

def test_grant_auxiliary_officer_success():
    member_id = "4606798"  # Darold Adami, no officer position
    r = client.post(f"/members/{member_id}/auxiliary-officer", headers=_privileged_auth())
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert "Darold" in data["message"]
    assert "granted" in data["message"]


def test_grant_auxiliary_officer_reflected_in_members_list():
    member_id = "4606798"
    client.post(f"/members/{member_id}/auxiliary-officer", headers=_privileged_auth())
    r = client.get("/members", headers=_privileged_auth())
    member = next(m for m in r.json() if m["memberNumber"] == member_id)
    assert member["isAuxiliaryOfficer"] is True


def test_grant_auxiliary_officer_login_returns_is_officer_true():
    member_id = "4661909"  # Jeffrey Aday, no officer position
    client.post(f"/members/{member_id}/auxiliary-officer", headers=_privileged_auth())
    r = client.post("/auth/login", json={"membershipNumber": member_id, "passcode": "koc830"})
    assert r.status_code == 200
    token = r.json()["token"]
    payload = pyjwt.decode(token, _JWT_SECRET, algorithms=["HS256"])
    assert payload["isOfficer"] is True


def test_grant_fails_for_existing_officer():
    member_id = "4897307"  # Grand Knight
    r = client.post(f"/members/{member_id}/auxiliary-officer", headers=_privileged_auth())
    assert r.status_code == 409
    assert "already an officer" in r.json()["detail"]


def test_grant_fails_for_admin():
    r = client.post("/members/830999999/auxiliary-officer", headers=_privileged_auth())
    assert r.status_code == 409
    assert "already an officer" in r.json()["detail"]


def test_grant_fails_for_nonexistent_member():
    r = client.post("/members/9999999/auxiliary-officer", headers=_privileged_auth())
    assert r.status_code == 404


def test_grant_requires_privileged_officer():
    member_id = "4606798"
    r = client.post(f"/members/{member_id}/auxiliary-officer", headers=_non_privileged_officer_auth())
    assert r.status_code == 403


def test_grant_requires_auth():
    r = client.post("/members/4606798/auxiliary-officer")
    assert r.status_code == 401


# --- Revoke auxiliary officer ---

def test_revoke_auxiliary_officer_success():
    member_id = "4606798"
    client.post(f"/members/{member_id}/auxiliary-officer", headers=_privileged_auth())
    r = client.delete(f"/members/{member_id}/auxiliary-officer", headers=_privileged_auth())
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert "Darold" in data["message"]
    assert "revoked" in data["message"]


def test_revoke_auxiliary_officer_login_returns_is_officer_false():
    member_id = "4661909"
    client.post(f"/members/{member_id}/auxiliary-officer", headers=_privileged_auth())
    client.delete(f"/members/{member_id}/auxiliary-officer", headers=_privileged_auth())
    r = client.post("/auth/login", json={"membershipNumber": member_id, "passcode": "koc830"})
    assert r.status_code == 200
    token = r.json()["token"]
    payload = pyjwt.decode(token, _JWT_SECRET, algorithms=["HS256"])
    assert payload["isOfficer"] is False


def test_revoke_fails_for_existing_officer():
    member_id = "4897307"  # Grand Knight
    r = client.delete(f"/members/{member_id}/auxiliary-officer", headers=_privileged_auth())
    assert r.status_code == 409
    assert "already an officer" in r.json()["detail"]


def test_revoke_requires_privileged_officer():
    r = client.delete("/members/4606798/auxiliary-officer", headers=_non_privileged_officer_auth())
    assert r.status_code == 403


def test_revoke_requires_auth():
    r = client.delete("/members/4606798/auxiliary-officer")
    assert r.status_code == 401

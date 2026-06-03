import base64

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.seed import reset_to_seed

client = TestClient(app)

# Minimal valid PNG: 1x1 pixel transparent
_VALID_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
    b"\r\n\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)
_VALID_PNG_B64 = base64.b64encode(_VALID_PNG).decode()

_NOT_PNG = b"This is not a PNG file at all"
_NOT_PNG_B64 = base64.b64encode(_NOT_PNG).decode()


@pytest.fixture(autouse=True)
def reset():
    reset_to_seed()
    yield
    reset_to_seed()


def _token(member_number: str, passcode: str) -> str:
    r = client.post("/auth/login", json={"membershipNumber": member_number, "passcode": passcode})
    assert r.status_code == 200
    return r.json()["token"]


def _privileged_auth() -> dict:
    return {"Authorization": f"Bearer {_token('8301002', 'charity830')}"}


def _deputy_gk_auth() -> dict:
    return {"Authorization": f"Bearer {_token('8301001', 'faith830')}"}


def _non_officer_auth() -> dict:
    return {"Authorization": f"Bearer {_token('8301015', 'hope830')}"}


# ---------------------------------------------------------------------------
# GET /officers
# ---------------------------------------------------------------------------

def test_get_officers_public_no_auth():
    r = client.get("/officers")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 14
    assert data[0]["title"] == "Grand Knight"
    assert data[13]["title"] == "Lecturer"


def test_get_officers_returns_correct_fields():
    r = client.get("/officers")
    first = r.json()[0]
    assert "title" in first
    assert "name" in first
    assert "photoUrl" in first


# ---------------------------------------------------------------------------
# PUT /officers/{title}
# ---------------------------------------------------------------------------

def test_put_officer_privileged_success():
    r = client.put(
        "/officers/Treasurer",
        json={"memberNumber": "8301004", "photoData": _VALID_PNG_B64, "photoFilename": "new.png"},
        headers=_privileged_auth(),
    )
    assert r.status_code == 200
    assert r.json()["success"] is True

    roster = client.get("/officers").json()
    treasurer = next(o for o in roster if o["title"] == "Treasurer")
    assert "Radcliffe" in treasurer["name"]


def test_put_officer_deputy_gk_success():
    r = client.put(
        "/officers/Treasurer",
        json={"memberNumber": "8301004", "photoData": _VALID_PNG_B64, "photoFilename": "new.png"},
        headers=_deputy_gk_auth(),
    )
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_put_officer_non_privileged_rejected():
    r = client.put(
        "/officers/Treasurer",
        json={"memberNumber": "8301004", "photoData": _VALID_PNG_B64, "photoFilename": "new.png"},
        headers=_non_officer_auth(),
    )
    assert r.status_code == 403


def test_put_officer_no_auth_rejected():
    r = client.put(
        "/officers/Treasurer",
        json={"memberNumber": "8301004", "photoData": _VALID_PNG_B64, "photoFilename": "new.png"},
    )
    assert r.status_code == 401


def test_put_officer_invalid_title():
    r = client.put(
        "/officers/Supreme%20Leader",
        json={"memberNumber": "8301004", "photoData": _VALID_PNG_B64, "photoFilename": "new.png"},
        headers=_privileged_auth(),
    )
    assert r.status_code == 404


def test_put_officer_invalid_member():
    r = client.put(
        "/officers/Treasurer",
        json={"memberNumber": "9999999", "photoData": _VALID_PNG_B64, "photoFilename": "new.png"},
        headers=_privileged_auth(),
    )
    assert r.status_code == 404


def test_put_officer_invalid_png():
    r = client.put(
        "/officers/Treasurer",
        json={"memberNumber": "8301004", "photoData": _NOT_PNG_B64, "photoFilename": "fake.png"},
        headers=_privileged_auth(),
    )
    assert r.status_code == 422
    assert "PNG" in r.json()["detail"]


def test_put_officer_invalid_base64():
    r = client.put(
        "/officers/Treasurer",
        json={"memberNumber": "8301004", "photoData": "not-valid-base64!!!", "photoFilename": "bad.png"},
        headers=_privileged_auth(),
    )
    assert r.status_code == 422


def test_put_officer_clears_old_member_position():
    roster_before = client.get("/officers").json()
    treasurer_before = next(o for o in roster_before if o["title"] == "Treasurer")
    assert "Manning" in treasurer_before["name"]

    r = client.put(
        "/officers/Treasurer",
        json={"memberNumber": "8301004", "photoData": _VALID_PNG_B64, "photoFilename": "new.png"},
        headers=_privileged_auth(),
    )
    assert r.status_code == 200

    members_r = client.get("/members", headers=_privileged_auth())
    manning = next(m for m in members_r.json() if m["memberNumber"] == "8301005")
    assert manning["officerPosition"] is None


# ---------------------------------------------------------------------------
# JWT includes officerPosition
# ---------------------------------------------------------------------------

def test_jwt_includes_officer_position_for_officer():
    r = client.post("/auth/login", json={"membershipNumber": "8301002", "passcode": "charity830"})
    payload = pyjwt.decode(r.json()["token"], options={"verify_signature": False})
    assert payload["officerPosition"] == "Grand Knight"


def test_jwt_includes_null_officer_position_for_non_officer():
    r = client.post("/auth/login", json={"membershipNumber": "8301015", "passcode": "hope830"})
    payload = pyjwt.decode(r.json()["token"], options={"verify_signature": False})
    assert payload["officerPosition"] is None


def test_jwt_includes_officer_position_for_deputy_gk():
    r = client.post("/auth/login", json={"membershipNumber": "8301001", "passcode": "faith830"})
    payload = pyjwt.decode(r.json()["token"], options={"verify_signature": False})
    assert payload["officerPosition"] == "Deputy Grand Knight"

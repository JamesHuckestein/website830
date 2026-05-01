from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _get_token(member_number: str = "8301001", passcode: str = "faith830") -> str:
    response = client.post(
        "/auth/login",
        json={"membershipNumber": member_number, "passcode": passcode},
    )
    return response.json()["token"]


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_success():
    response = client.post(
        "/auth/login",
        json={"membershipNumber": "8301001", "passcode": "faith830"},
    )
    assert response.status_code == 200
    assert "token" in response.json()


def test_login_second_demo_credential():
    response = client.post(
        "/auth/login",
        json={"membershipNumber": "8301002", "passcode": "charity830"},
    )
    assert response.status_code == 200
    assert "token" in response.json()


def test_login_wrong_passcode():
    response = client.post(
        "/auth/login",
        json={"membershipNumber": "8301001", "passcode": "wrongpassword"},
    )
    assert response.status_code == 401


def test_login_unknown_member():
    response = client.post(
        "/auth/login",
        json={"membershipNumber": "9999999", "passcode": "anything"},
    )
    assert response.status_code == 401


def test_members_requires_auth():
    response = client.get("/members")
    assert response.status_code == 401


def test_members_with_valid_token():
    token = _get_token()
    response = client.get("/members", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    members = response.json()
    assert isinstance(members, list)
    assert len(members) == 2


def test_members_with_invalid_token():
    response = client.get("/members", headers={"Authorization": "Bearer notavalidtoken"})
    assert response.status_code == 401

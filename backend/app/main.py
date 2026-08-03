import base64
import csv
import io
import logging
import os
import uuid
from datetime import date, datetime, time, timedelta, timezone

import httpx
import jwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

from app.repos import announcements as announcements_repo
from app.repos import events as events_repo
from app.repos import meeting_minutes as meeting_minutes_repo
from app.repos import members as members_repo
from app.repos import officers as officers_repo
from app.repos import photos as photos_repo
from app.repos import prayer_requests as prayer_requests_repo
from app.seed import ADMIN_MEMBER_NUMBER


logger = logging.getLogger(__name__)

app = FastAPI(title="KoC Council 830 API")

_CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

_JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production!!")
_JWT_ALGORITHM = "HS256"
_EMAIL_GATEWAY_URL = os.getenv("EMAIL_GATEWAY_URL")
_COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
_COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID")
_COGNITO_REGION = os.getenv("AWS_REGION", "us-east-1")

OFFICER_TITLES = {
    "Grand Knight", "Deputy Grand Knight", "Chancellor", "Advocate",
    "Recorder", "Treasurer", "Warden", "Inside Guard", "Outside Guard",
    "Trustee - 1 Year", "Trustee - 2 Year", "Trustee - 3 Year",
    "Financial Secretary", "Lecturer",
}

PRIVILEGED_OFFICER_TITLES = {"Grand Knight", "Deputy Grand Knight", "Recorder", "Financial Secretary"}

_bearer = HTTPBearer()


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    membershipNumber: str
    passcode: str

class UpdateContactRequest(BaseModel):
    addressStreet: str
    addressCity: str
    addressState: str
    addressZip: str
    phone: str
    email: str

class PrayerRequestCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)

class EmailOfficerRequest(BaseModel):
    officerTitle: str
    message: str

class EmailAllMembersRequest(BaseModel):
    message: str

class NominationRequest(BaseModel):
    knightOfMonth: str
    familyOfMonth: str

class _EventBody(BaseModel):
    """Shared request shape for POST /events and PUT /events/{id}.

    The Field `pattern` arguments guard shape; the @field_validator hooks below
    add semantic checks (real calendar date, valid 24-hour time) that the regex
    alone cannot enforce — e.g. "2026-02-30" or "25:99" pass the regex but are
    rejected here with HTTP 422.
    """
    day: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
    timeOfDay: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    location: str | None = Field(default=None, max_length=200)

    @field_validator("day")
    @classmethod
    def _validate_day(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError as e:
            raise ValueError("day must be a real calendar date in YYYY-MM-DD format") from e
        return v

    @field_validator("timeOfDay")
    @classmethod
    def _validate_time(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            time.fromisoformat(v)
        except ValueError as e:
            raise ValueError("timeOfDay must be a valid HH:MM 24-hour time") from e
        return v


class EventCreate(_EventBody):
    pass


class EventUpdate(_EventBody):
    pass


class _AnnouncementBody(BaseModel):
    """Shared request shape for POST /announcements and PUT /announcements/{id}.

    `delete_date` must be a real calendar date >= today. Officers should use
    DELETE to remove an announcement immediately rather than back-dating it.
    """
    deleteDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    title: str = Field(min_length=1, max_length=200)
    details: str = Field(min_length=1, max_length=2000)

    @field_validator("deleteDate")
    @classmethod
    def _validate_delete_date(cls, v: str) -> str:
        try:
            parsed = date.fromisoformat(v)
        except ValueError as e:
            raise ValueError("deleteDate must be a real calendar date in YYYY-MM-DD format") from e
        if parsed < _today():
            raise ValueError("deleteDate cannot be in the past")
        return v


class AnnouncementCreate(_AnnouncementBody):
    pass


class AnnouncementUpdate(_AnnouncementBody):
    pass


class _PhotoBody(BaseModel):
    """Shared request shape for POST /photos and PUT /photos/{id}.

    Phase-2 dev: `photoUrl` is a plain string (path or URL). A future phase
    swaps this for a multipart upload pipeline + S3 storage.
    """
    title: str = Field(min_length=1, max_length=200)
    photoUrl: str = Field(min_length=1, max_length=2048)

    @field_validator("title")
    @classmethod
    def _strip_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("title cannot be blank")
        return stripped

    @field_validator("photoUrl")
    @classmethod
    def _strip_photo_url(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("photoUrl cannot be blank")
        return stripped


class PhotoCreate(_PhotoBody):
    pass


class PhotoUpdate(_PhotoBody):
    pass


class OfficerUpdateRequest(BaseModel):
    memberNumber: str = Field(min_length=1)
    photoData: str = Field(min_length=1)
    photoFilename: str = Field(min_length=1)


class _MemberBody(BaseModel):
    memberNumber: str = Field(pattern=r"^\d{6,9}$")
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)
    addressStreet: str = Field(min_length=1)
    addressCity: str = Field(min_length=1)
    addressState: str = Field(min_length=1, max_length=2)
    addressZip: str = Field(min_length=5, max_length=10)
    phone: str = ""
    birthday: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    email: str = ""
    assemblyNumber: str | None = None
    firstDegreeDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    secondDegreeDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    thirdDegreeDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    fourthDegreeDate: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")

    @field_validator("birthday", "firstDegreeDate", "secondDegreeDate", "thirdDegreeDate")
    @classmethod
    def _validate_required_date(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError as e:
            raise ValueError("must be a real calendar date in YYYY-MM-DD format") from e
        return v

    @field_validator("fourthDegreeDate")
    @classmethod
    def _validate_optional_date(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            date.fromisoformat(v)
        except ValueError as e:
            raise ValueError("must be a real calendar date in YYYY-MM-DD format") from e
        return v


class CreateMemberRequest(_MemberBody):
    passcode: str = Field(min_length=1)


class UpdateMemberFullRequest(_MemberBody):
    passcode: str | None = None


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(min_length=1)
    newPassword: str = Field(min_length=8)


class AdminPasswordUpdateRequest(BaseModel):
    passcode: str = Field(min_length=1)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

_cognito_jwks: dict | None = None


def _get_cognito_jwks() -> dict:
    global _cognito_jwks
    if _cognito_jwks is None:
        import urllib.request
        jwks_url = f"https://cognito-idp.{_COGNITO_REGION}.amazonaws.com/{_COGNITO_USER_POOL_ID}/.well-known/jwks.json"
        with urllib.request.urlopen(jwks_url) as resp:
            _cognito_jwks = __import__("json").loads(resp.read())
    return _cognito_jwks


def _validate_cognito_token(token: str) -> dict:
    from jose import jwt as jose_jwt, JWTError
    jwks = _get_cognito_jwks()
    try:
        payload = jose_jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=f"https://cognito-idp.{_COGNITO_REGION}.amazonaws.com/{_COGNITO_USER_POOL_ID}",
            options={"verify_aud": False},
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    member_number = payload.get("username") or payload.get("sub")
    member = members_repo.get_by_number(member_number)
    if member is None:
        raise HTTPException(status_code=401, detail="Member not found")
    is_admin = member.get("is_admin", False)
    return {
        "sub": member_number,
        "isOfficer": _is_officer(member.get("officer_position")) or is_admin or member.get("is_auxiliary_officer", False),
        "officerPosition": member.get("officer_position"),
        "isAdmin": is_admin,
    }


def _require_auth(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    token = credentials.credentials
    if _COGNITO_USER_POOL_ID:
        return _validate_cognito_token(token)
    try:
        return jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _require_officer(payload: dict = Depends(_require_auth)) -> dict:
    if not payload.get("isOfficer"):
        raise HTTPException(status_code=403, detail="Officer access required")
    return payload


def _require_privileged_officer(payload: dict = Depends(_require_auth)) -> dict:
    if payload.get("isAdmin"):
        return payload
    if payload.get("officerPosition") not in PRIVILEGED_OFFICER_TITLES:
        raise HTTPException(
            status_code=403,
            detail="Only Grand Knight, Deputy Grand Knight, Recorder, or Financial Secretary may update officers.",
        )
    return payload


def _is_officer(officer_position: str | None) -> bool:
    return officer_position in OFFICER_TITLES


def _is_admin_member(m: dict) -> bool:
    return m.get("is_admin", False)


def _today() -> date:
    return date.today()


def _now_iso() -> str:
    return _today().isoformat() + "T00:00:00Z"


def _now_iso_precise() -> str:
    """ISO 8601 UTC timestamp with second precision.

    Used where same-day insertion order matters (e.g. the photo gallery's
    oldest-first sort): `_now_iso()`'s `T00:00:00Z` truncation collapses every
    same-day record onto the same string, after which the secondary UUID
    tiebreaker is random and breaks the documented \"newest at the bottom\"
    ordering.
    """
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def _member_to_response(m: dict) -> dict:
    return {
        "memberNumber": m["member_number"],
        "firstName": m.get("first_name", ""),
        "lastName": m.get("last_name", ""),
        "addressStreet": m.get("address_street"),
        "addressCity": m.get("address_city"),
        "addressState": m.get("address_state"),
        "addressZip": m.get("address_zip"),
        "phone": m.get("phone", ""),
        "birthday": m.get("birthday"),
        "officerPosition": m.get("officer_position"),
        "email": m.get("email", ""),
        "assemblyNumber": m.get("assembly_number"),
        "firstDegreeDate": m.get("first_degree_date"),
        "secondDegreeDate": m.get("second_degree_date"),
        "thirdDegreeDate": m.get("third_degree_date"),
        "fourthDegreeDate": m.get("fourth_degree_date"),
        "isAuxiliaryOfficer": m.get("is_auxiliary_officer", False),
    }


def _prayer_request_to_response(r: dict) -> dict:
    return {
        "id": r["id"],
        "text": r.get("text", ""),
        "submittedBy": r["submitted_by"],
        "submittedAt": r["submitted_at"],
    }


def _event_to_response(e: dict) -> dict:
    return {
        "id": e["id"],
        "day": e["day"],
        "title": e["title"],
        "description": e["description"],
        "timeOfDay": e.get("time_of_day"),
        "location": e.get("location"),
        "createdBy": e["created_by"],
        "createdAt": e["created_at"],
        "updatedAt": e["updated_at"],
    }


def _announcement_to_response(a: dict) -> dict:
    return {
        "id": a["id"],
        "title": a["title"],
        "details": a["details"],
        "deleteDate": a["delete_date"],
        "createdBy": a["created_by"],
        "createdAt": a["created_at"],
        "updatedAt": a["updated_at"],
    }


def _photo_to_response(p: dict) -> dict:
    return {
        "id": p["id"],
        "title": p["title"],
        "photoUrl": p["photo_url"],
        "createdBy": p["created_by"],
        "createdAt": p["created_at"],
        "updatedAt": p["updated_at"],
    }


def _send_email(to: str | list[str], subject: str, body: str) -> None:
    if not _EMAIL_GATEWAY_URL:
        logger.info("Email stub (EMAIL_GATEWAY_URL not set): to=%s subject=%s", to, subject)
        return
    httpx.post(_EMAIL_GATEWAY_URL, json={"to": to, "subject": subject, "body": body}, timeout=10)




# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login")
def login(body: LoginRequest):
    if _COGNITO_USER_POOL_ID:
        return _cognito_login(body.membershipNumber, body.passcode)
    member = members_repo.get_by_number(body.membershipNumber)
    if member is None or member.get("passcode") != body.passcode:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    is_admin = member.get("is_admin", False)
    is_officer = _is_officer(member.get("officer_position")) or is_admin or member.get("is_auxiliary_officer", False)
    token = jwt.encode(
        {
            "sub": member["member_number"],
            "isOfficer": is_officer,
            "officerPosition": member.get("officer_position"),
            "isAdmin": is_admin,
        },
        _JWT_SECRET,
        algorithm=_JWT_ALGORITHM,
    )
    return {"token": token}


def _cognito_login(username: str, password: str) -> dict:
    import boto3
    client = boto3.client("cognito-idp", region_name=_COGNITO_REGION)
    try:
        resp = client.initiate_auth(
            ClientId=_COGNITO_APP_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": username, "PASSWORD": password},
        )
    except client.exceptions.NotAuthorizedException:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except client.exceptions.UserNotFoundException:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except client.exceptions.UserNotConfirmedException:
        raise HTTPException(status_code=401, detail="Account not confirmed")
    result = resp.get("AuthenticationResult", {})
    token = result.get("AccessToken") or result.get("IdToken")
    if not token:
        challenge = resp.get("ChallengeName")
        if challenge == "NEW_PASSWORD_REQUIRED":
            raise HTTPException(status_code=401, detail="Password change required")
        raise HTTPException(status_code=401, detail="Authentication failed")
    member = members_repo.get_by_number(username)
    is_admin = member.get("is_admin", False) if member else False
    officer_position = member.get("officer_position") if member else None
    is_aux = member.get("is_auxiliary_officer", False) if member else False
    return {
        "token": token,
        "memberNumber": username,
        "isOfficer": _is_officer(officer_position) or is_admin or is_aux,
        "officerPosition": officer_position,
        "isAdmin": is_admin,
    }


@app.get("/members/birthdays")
def get_birthdays(_payload: dict = Depends(_require_auth)):
    return [_member_to_response(m) for m in members_repo.get_birthdays()]


@app.get("/members/export-csv")
def export_members_csv(_payload: dict = Depends(_require_officer)):
    fields = [
        "memberNumber", "firstName", "lastName", "addressStreet", "addressCity",
        "addressState", "addressZip", "phone", "birthday", "officerPosition",
        "email", "assemblyNumber", "firstDegreeDate", "secondDegreeDate",
        "thirdDegreeDate", "fourthDegreeDate",
    ]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for m in members_repo.list_all():
        writer.writerow(_member_to_response(m))
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=koc-830-members.csv"},
    )


@app.get("/members")
def get_members(_payload: dict = Depends(_require_auth)):
    return [_member_to_response(m) for m in members_repo.list_all()]


@app.get("/members/{member_id}")
def get_member(member_id: str, _payload: dict = Depends(_require_auth)):
    member = members_repo.get_by_number(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if _is_admin_member(member) and not _payload.get("isAdmin"):
        raise HTTPException(status_code=404, detail="Member not found")
    return _member_to_response(member)


@app.put("/members/change-password")
def change_password(body: ChangePasswordRequest, payload: dict = Depends(_require_auth)):
    member_number = payload["sub"]
    if _COGNITO_USER_POOL_ID:
        _cognito_change_password(member_number, body.currentPassword, body.newPassword)
    else:
        member = members_repo.get_by_number(member_number)
        if member is None or member.get("passcode") != body.currentPassword:
            raise HTTPException(status_code=401, detail="Current password is incorrect.")
        members_repo.update_passcode(member_number, body.newPassword)
    return {"success": True, "message": "Password changed successfully."}


@app.put("/members/{member_id}")
def update_member(member_id: str, body: UpdateContactRequest, _payload: dict = Depends(_require_auth)):
    member = members_repo.get_by_number(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if _is_admin_member(member) and not _payload.get("isAdmin"):
        raise HTTPException(status_code=403, detail="Cannot modify admin account.")
    members_repo.update_contact(member_id, {
        "address_street": body.addressStreet,
        "address_city": body.addressCity,
        "address_state": body.addressState,
        "address_zip": body.addressZip,
        "phone": body.phone,
        "email": body.email,
    })
    return {"success": True, "message": "Contact information updated."}


@app.post("/members", status_code=201)
def create_member(body: CreateMemberRequest, _payload: dict = Depends(_require_privileged_officer)):
    item = {
        "member_number": body.memberNumber,
        "passcode": body.passcode,
        "first_name": body.firstName,
        "last_name": body.lastName,
        "address_street": body.addressStreet,
        "address_city": body.addressCity,
        "address_state": body.addressState,
        "address_zip": body.addressZip,
        "phone": body.phone,
        "birthday": body.birthday,
        "email": body.email,
        "assembly_number": body.assemblyNumber,
        "first_degree_date": body.firstDegreeDate,
        "second_degree_date": body.secondDegreeDate,
        "third_degree_date": body.thirdDegreeDate,
        "fourth_degree_date": body.fourthDegreeDate,
    }
    if not members_repo.create(item):
        raise HTTPException(status_code=409, detail="A member with that number already exists.")
    if _COGNITO_USER_POOL_ID:
        _cognito_create_user(body.memberNumber, body.passcode, body.email)
    return {"success": True, "message": "Member added successfully."}


@app.put("/members/{member_id}/full")
def update_member_full(member_id: str, body: UpdateMemberFullRequest, _payload: dict = Depends(_require_privileged_officer)):
    member = members_repo.get_by_number(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if _is_admin_member(member) and not _payload.get("isAdmin"):
        raise HTTPException(status_code=403, detail="Cannot modify admin account.")
    if body.memberNumber != member_id:
        conflict = members_repo.get_by_number(body.memberNumber)
        if conflict is not None:
            raise HTTPException(status_code=409, detail="A member with that number already exists.")
    fields: dict = {
        "first_name": body.firstName,
        "last_name": body.lastName,
        "address_street": body.addressStreet,
        "address_city": body.addressCity,
        "address_state": body.addressState,
        "address_zip": body.addressZip,
        "phone": body.phone,
        "birthday": body.birthday,
        "email": body.email,
        "assembly_number": body.assemblyNumber,
        "first_degree_date": body.firstDegreeDate,
        "second_degree_date": body.secondDegreeDate,
        "third_degree_date": body.thirdDegreeDate,
        "fourth_degree_date": body.fourthDegreeDate,
    }
    if body.passcode:
        fields["passcode"] = body.passcode
    if body.memberNumber != member_id:
        fields["member_number"] = body.memberNumber
        members_repo.delete(member_id)
        fields["officer_position"] = member.get("officer_position")
        members_repo.create(fields)
    else:
        members_repo.update_full(member_id, fields)
    if body.passcode and _COGNITO_USER_POOL_ID:
        _cognito_set_password(member_id, body.passcode)
    return {"success": True, "message": "Member updated successfully."}


@app.delete("/members/{member_id}")
def delete_member(member_id: str, _payload: dict = Depends(_require_privileged_officer)):
    member = members_repo.get_by_number(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if _is_admin_member(member):
        raise HTTPException(status_code=403, detail="Cannot delete admin account.")
    members_repo.delete(member_id)
    if member.get("officer_position"):
        officers_repo.clear_slot(member["officer_position"])
    if _COGNITO_USER_POOL_ID:
        _cognito_delete_user(member_id)
    return {"success": True, "message": "Member deleted successfully."}


@app.post("/members/{member_id}/auxiliary-officer")
def grant_auxiliary_officer(member_id: str, _payload: dict = Depends(_require_privileged_officer)):
    member = members_repo.get_by_number(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found.")
    if _is_admin_member(member):
        raise HTTPException(status_code=409, detail="This member is already an officer and their privileges may not be altered here.")
    if member.get("officer_position") in OFFICER_TITLES:
        raise HTTPException(status_code=409, detail="This member is already an officer and their privileges may not be altered here.")
    members_repo.set_auxiliary_officer(member_id, True)
    name = f"{member.get('first_name', '')} {member.get('last_name', '')}".strip()
    return {"success": True, "message": f"Officer privileges granted to {name}."}


@app.delete("/members/{member_id}/auxiliary-officer")
def revoke_auxiliary_officer(member_id: str, _payload: dict = Depends(_require_privileged_officer)):
    member = members_repo.get_by_number(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found.")
    if member.get("officer_position") in OFFICER_TITLES:
        raise HTTPException(status_code=409, detail="This member is already an officer and their privileges may not be altered here.")
    members_repo.set_auxiliary_officer(member_id, False)
    name = f"{member.get('first_name', '')} {member.get('last_name', '')}".strip()
    return {"success": True, "message": f"Officer privileges revoked from {name}."}


@app.put("/admin/password")
def update_admin_password(body: AdminPasswordUpdateRequest, payload: dict = Depends(_require_auth)):
    if not payload.get("isAdmin"):
        raise HTTPException(status_code=403, detail="Admin access required.")
    if _COGNITO_USER_POOL_ID:
        _cognito_set_password(ADMIN_MEMBER_NUMBER, body.passcode)
    else:
        result = members_repo.update_passcode(ADMIN_MEMBER_NUMBER, body.passcode)
        if result is None:
            raise HTTPException(status_code=404, detail="Admin account not found.")
    return {"success": True, "message": "Password updated successfully."}


def _cognito_change_password(username: str, current_password: str, new_password: str) -> None:
    import boto3
    client = boto3.client("cognito-idp", region_name=_COGNITO_REGION)
    try:
        resp = client.initiate_auth(
            ClientId=_COGNITO_APP_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": username, "PASSWORD": current_password},
        )
    except (client.exceptions.NotAuthorizedException, client.exceptions.UserNotFoundException):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    access_token = resp.get("AuthenticationResult", {}).get("AccessToken")
    if not access_token:
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    try:
        client.change_password(
            PreviousPassword=current_password,
            ProposedPassword=new_password,
            AccessToken=access_token,
        )
    except client.exceptions.InvalidPasswordException as e:
        raise HTTPException(status_code=422, detail=str(e))


def _cognito_set_password(username: str, new_password: str) -> None:
    import boto3
    client = boto3.client("cognito-idp", region_name=_COGNITO_REGION)
    client.admin_set_user_password(
        UserPoolId=_COGNITO_USER_POOL_ID,
        Username=username,
        Password=new_password,
        Permanent=True,
    )


def _cognito_delete_user(username: str) -> None:
    import boto3
    client = boto3.client("cognito-idp", region_name=_COGNITO_REGION)
    try:
        client.admin_delete_user(UserPoolId=_COGNITO_USER_POOL_ID, Username=username)
    except client.exceptions.UserNotFoundException:
        pass


def _cognito_create_user(username: str, password: str, email: str = "") -> None:
    import boto3
    client = boto3.client("cognito-idp", region_name=_COGNITO_REGION)
    user_attrs = []
    if email:
        user_attrs.append({"Name": "email", "Value": email})
        user_attrs.append({"Name": "email_verified", "Value": "true"})
    client.admin_create_user(
        UserPoolId=_COGNITO_USER_POOL_ID,
        Username=username,
        UserAttributes=user_attrs,
        TemporaryPassword=password,
        MessageAction="SUPPRESS",
    )
    client.admin_set_user_password(
        UserPoolId=_COGNITO_USER_POOL_ID,
        Username=username,
        Password=password,
        Permanent=True,
    )


@app.get("/prayer-requests")
def get_prayer_requests(_payload: dict = Depends(_require_auth)):
    return [_prayer_request_to_response(r) for r in prayer_requests_repo.list_all()]


@app.get("/prayer-requests/public")
def get_prayer_requests_public():
    return [
        {"id": r["id"], "text": r.get("text", ""), "submittedAt": r.get("submitted_at", "")}
        for r in prayer_requests_repo.list_public()
    ]


@app.post("/prayer-requests")
def create_prayer_request(body: PrayerRequestCreate, payload: dict = Depends(_require_auth)):
    new_id = str(uuid.uuid4())
    s3_key = f"prayer-requests/{date.today().strftime('%Y/%m')}/{new_id}.txt"
    record = {
        "id": new_id,
        "s3_key": s3_key,
        "text": body.text,
        "submitted_by": payload["sub"],
        "submitted_at": date.today().isoformat() + "T00:00:00Z",
    }
    prayer_requests_repo.create(record)
    logger.info("S3 stub: would write prayer request to %s", s3_key)
    return {"success": True, "message": "Prayer request submitted."}


@app.delete("/prayer-requests/{request_id}")
def delete_prayer_request(request_id: str, payload: dict = Depends(_require_auth)):
    record = prayer_requests_repo.get_by_id(request_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Prayer request not found.")
    if record["submitted_by"] != payload["sub"] and not payload.get("isOfficer"):
        raise HTTPException(status_code=403, detail="You can only delete your own prayer requests.")
    prayer_requests_repo.delete(request_id)
    return {"success": True, "message": "Prayer request deleted."}


@app.get("/meeting-minutes")
def get_meeting_minutes(_payload: dict = Depends(_require_auth)):
    return [
        {"id": m["id"], "title": m.get("title", ""), "meetingDate": m.get("meeting_date", ""), "s3Key": m.get("s3_key", "")}
        for m in meeting_minutes_repo.list_all()
    ]


@app.get("/meeting-minutes/{minutes_id}")
def get_meeting_minutes_detail(minutes_id: str, _payload: dict = Depends(_require_auth)):
    entry = meeting_minutes_repo.get_by_id(minutes_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Meeting minutes not found")
    s3_key = entry.get("s3_key", "")
    url = s3_key
    if s3_key:
        import boto3
        s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION", "us-east-1"))
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": "koc830-assets", "Key": s3_key},
            ExpiresIn=3600,
        )
    return {"id": entry["id"], "title": entry.get("title", ""), "meetingDate": entry.get("meeting_date", ""), "url": url}


@app.post("/meeting-minutes")
async def create_meeting_minutes(
    title: str = Form(..., min_length=1, max_length=200),
    meetingDate: str = Form(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    file: UploadFile = File(...),
    payload: dict = Depends(_require_officer),
):
    try:
        date.fromisoformat(meetingDate)
    except ValueError:
        raise HTTPException(status_code=422, detail="meetingDate must be a valid YYYY-MM-DD date")
    content = await file.read()
    if not content[:5].startswith(b"%PDF"):
        raise HTTPException(status_code=422, detail="Only PDF files are allowed.")
    new_id = str(uuid.uuid4())
    parsed_date = date.fromisoformat(meetingDate)
    s3_key = f"meeting-minutes/{parsed_date.strftime('%Y/%m')}/{new_id}.pdf"
    import boto3
    s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION", "us-east-1"))
    s3.put_object(Bucket="koc830-assets", Key=s3_key, Body=content, ContentType="application/pdf")
    now = _now_iso_precise()
    record = {
        "id": new_id,
        "title": title,
        "meeting_date": meetingDate,
        "s3_key": s3_key,
        "created_by": payload["sub"],
        "created_at": now,
    }
    meeting_minutes_repo.create(record)
    return {"success": True, "message": "Meeting minutes uploaded.", "id": new_id}


@app.delete("/meeting-minutes/{minutes_id}")
def delete_meeting_minutes(minutes_id: str, _payload: dict = Depends(_require_officer)):
    entry = meeting_minutes_repo.get_by_id(minutes_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Meeting minutes not found.")
    if entry.get("s3_key"):
        import boto3
        s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION", "us-east-1"))
        try:
            s3.delete_object(Bucket="koc830-assets", Key=entry["s3_key"])
        except Exception:
            logger.warning("Failed to delete S3 object: %s", entry["s3_key"])
    meeting_minutes_repo.delete(minutes_id)
    return {"success": True, "message": "Meeting minutes deleted."}


@app.get("/events")
def get_events(month: str | None = None):
    """List events.

    Without arguments, returns all events. With ``?month=YYYY-MM``, returns only
    events whose ``day`` (a ``YYYY-MM-DD`` string) starts with that prefix —
    i.e. events that fall in that calendar month. Other ``month`` formats raise
    HTTP 400.
    """
    if month is not None:
        if len(month) != 7 or month[4] != "-":
            raise HTTPException(status_code=400, detail="month must be in YYYY-MM format")
        items = events_repo.list_by_month(month)
    else:
        items = events_repo.list_all()
    return [_event_to_response(e) for e in items]


@app.post("/events")
def create_event(body: EventCreate, payload: dict = Depends(_require_officer)):
    if events_repo.count_by_day(body.day) >= 3:
        raise HTTPException(status_code=409, detail="This day already has the maximum of 3 events.")
    new_id = str(uuid.uuid4())
    now = _now_iso()
    record = {
        "id": new_id,
        "day": body.day,
        "title": body.title,
        "description": body.description,
        "time_of_day": body.timeOfDay,
        "location": body.location,
        "created_by": payload["sub"],
        "created_at": now,
        "updated_at": now,
    }
    events_repo.create(record)
    return {"success": True, "message": "Event created.", "id": new_id}


@app.put("/events/{event_id}")
def update_event(event_id: str, body: EventUpdate, payload: dict = Depends(_require_officer)):
    record = events_repo.get_by_id(event_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Event not found.")
    if body.day != record["day"]:
        if events_repo.count_by_day(body.day) >= 3:
            raise HTTPException(status_code=409, detail="Target day already has the maximum of 3 events.")
    events_repo.update(event_id, {
        "day": body.day,
        "title": body.title,
        "description": body.description,
        "time_of_day": body.timeOfDay,
        "location": body.location,
        "updated_at": _now_iso(),
    })
    return {"success": True, "message": "Event updated."}


@app.delete("/events/{event_id}")
def delete_event(event_id: str, _payload: dict = Depends(_require_officer)):
    if not events_repo.delete(event_id):
        raise HTTPException(status_code=404, detail="Event not found.")
    return {"success": True, "message": "Event deleted."}


@app.get("/announcements")
def get_announcements():
    """List active announcements.

    Public (no auth). Returns announcements where ``delete_date >= today``,
    sorted by ``created_at`` descending (newest first; id ascending as a
    deterministic tiebreaker for identical timestamps).
    """
    items = announcements_repo.list_active(_today().isoformat())
    return [_announcement_to_response(a) for a in items]


@app.post("/announcements")
def create_announcement(body: AnnouncementCreate, payload: dict = Depends(_require_officer)):
    new_id = str(uuid.uuid4())
    now = _now_iso()
    record = {
        "id": new_id,
        "title": body.title,
        "details": body.details,
        "delete_date": body.deleteDate,
        "created_by": payload["sub"],
        "created_at": now,
        "updated_at": now,
    }
    announcements_repo.create(record)
    return {"success": True, "message": "Announcement created.", "id": new_id}


@app.put("/announcements/{announcement_id}")
def update_announcement(
    announcement_id: str,
    body: AnnouncementUpdate,
    _payload: dict = Depends(_require_officer),
):
    existing = announcements_repo.get_by_id(announcement_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    announcements_repo.update(announcement_id, {
        "title": body.title,
        "details": body.details,
        "delete_date": body.deleteDate,
        "updated_at": _now_iso(),
    })
    return {"success": True, "message": "Announcement updated."}


@app.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: str, _payload: dict = Depends(_require_officer)):
    if not announcements_repo.delete(announcement_id):
        raise HTTPException(status_code=404, detail="Announcement not found.")
    return {"success": True, "message": "Announcement deleted."}


@app.get("/photos")
def get_photos():
    """List all photos in the gallery.

    Public (no auth). Returns photos sorted by ``created_at`` ascending
    (oldest first; id ascending as a deterministic tiebreaker), so the
    most recently added photo appears at the bottom of the two-column grid.
    """
    return [_photo_to_response(p) for p in photos_repo.list_all()]


@app.post("/photos")
def create_photo(body: PhotoCreate, payload: dict = Depends(_require_officer)):
    new_id = str(uuid.uuid4())
    now = _now_iso_precise()
    record = {
        "id": new_id,
        "title": body.title,
        "photo_url": body.photoUrl,
        "created_by": payload["sub"],
        "created_at": now,
        "updated_at": now,
    }
    photos_repo.create(record)
    return {"success": True, "message": "Photo added.", "id": new_id}


@app.put("/photos/{photo_id}")
def update_photo(
    photo_id: str,
    body: PhotoUpdate,
    _payload: dict = Depends(_require_officer),
):
    existing = photos_repo.get_by_id(photo_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Photo not found.")
    photos_repo.update(photo_id, {
        "title": body.title,
        "photo_url": body.photoUrl,
        "updated_at": _now_iso_precise(),
    })
    return {"success": True, "message": "Photo updated."}


@app.delete("/photos/{photo_id}")
def delete_photo(photo_id: str, _payload: dict = Depends(_require_officer)):
    if not photos_repo.delete(photo_id):
        raise HTTPException(status_code=404, detail="Photo not found.")
    return {"success": True, "message": "Photo deleted."}


@app.get("/officers")
def get_officers(request: Request):
    """List the current officer roster.

    Public (no auth). Returns officers in the canonical title order defined by
    OFFICER_TITLES_ORDERED. Photos that have been uploaded are served from the
    backend; their URLs are returned as absolute paths using the request's base.
    """
    base = str(request.base_url).rstrip("/")
    result = []
    for o in officers_repo.list_all():
        if o.get("photo_data"):
            photo_url = f"{base}{o['photo_url']}"
        else:
            photo_url = o.get("photo_url", "/officers/placeholder.png")
        result.append({"title": o["title"], "name": o.get("name", "Vacant"), "photoUrl": photo_url})
    return result


@app.put("/officers/{title}")
def update_officer(title: str, body: OfficerUpdateRequest, payload: dict = Depends(_require_privileged_officer)):
    if title not in OFFICER_TITLES:
        raise HTTPException(status_code=404, detail="Officer title not found.")
    member = members_repo.get_by_number(body.memberNumber)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found.")
    if _is_admin_member(member):
        raise HTTPException(status_code=422, detail="Cannot assign admin as an officer.")
    try:
        photo_bytes = __import__("base64").b64decode(body.photoData)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 photo data.")
    if photo_bytes[:4] != b"\x89PNG":
        raise HTTPException(status_code=422, detail="Only PNG photos are allowed.")
    officer_entry = officers_repo.get_by_title(title)
    if officer_entry is None:
        raise HTTPException(status_code=404, detail="Officer title not found.")
    old_member_number = officer_entry.get("member_number")
    slug = title.lower().replace(" ", "-").replace("---", "-")
    photo_url = f"/officers/photos/{slug}.png"
    name = f"{member.get('first_name', '')} {member.get('last_name', '')}"
    officers_repo.swap_officer(
        title=title,
        new_member_number=body.memberNumber,
        new_name=name,
        photo_url=photo_url,
        photo_data=photo_bytes,
        old_member_number=old_member_number,
    )
    return {"success": True, "message": "Officer updated."}


@app.get("/officers/photos/{filename}")
def get_officer_photo(filename: str):
    slug = filename.removesuffix(".png")
    photo_data = officers_repo.get_photo_by_slug(slug)
    if photo_data is None:
        raise HTTPException(status_code=404, detail="Officer photo not found.")
    if isinstance(photo_data, str):
        photo_data = base64.b64decode(photo_data)
    elif not isinstance(photo_data, bytes):
        photo_data = bytes(photo_data)
    return Response(content=photo_data, media_type="image/png")


@app.post("/emails/officer")
def email_officer(body: EmailOfficerRequest, payload: dict = Depends(_require_auth)):
    officer = members_repo.get_by_officer_position(body.officerTitle)
    if officer is None:
        raise HTTPException(status_code=404, detail="Officer not found")
    sender = members_repo.get_by_number(payload["sub"])
    sender_name = f"{sender['first_name']} {sender['last_name']}" if sender else "A council member"
    _send_email(
        officer.get("email", ""),
        f"Message from {sender_name}",
        body.message,
    )
    return {"success": True, "message": "Your message has been sent."}


@app.post("/nominations")
def submit_nomination(body: NominationRequest, _payload: dict = Depends(_require_auth)):
    officer_emails = members_repo.get_officer_emails()
    nomination_body = (
        f"Knight of the Month: {body.knightOfMonth}\n"
        f"Family of the Month: {body.familyOfMonth}"
    )
    _send_email(officer_emails, "Knight and Family of the Month Nomination", nomination_body)
    return {"success": True, "message": "Nomination submitted to council officers."}


@app.post("/emails/all-members")
def email_all_members(body: EmailAllMembersRequest, _payload: dict = Depends(_require_officer)):
    all_emails = members_repo.get_all_emails()
    _send_email(all_emails, "Message from Council 830 Officers", body.message)
    return {"success": True, "message": "Message sent to all members."}

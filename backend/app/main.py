import base64
import csv
import io
import logging
import os
import threading
import uuid
from datetime import date, datetime, time, timedelta, timezone

import httpx
import jwt
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

from app.seed import (
    ADMIN_MEMBER_NUMBER,
    OFFICER_TITLES_ORDERED,
    announcements_store,
    events_store,
    meeting_minutes_store,
    members_store,
    officers_store,
    photos_store,
    prayer_requests_store,
)

logger = logging.getLogger(__name__)

app = FastAPI(title="KoC Council 830 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production!!")
_JWT_ALGORITHM = "HS256"
_EMAIL_GATEWAY_URL = os.getenv("EMAIL_GATEWAY_URL")

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
    memberNumber: str = Field(pattern=r"^830\d{4}$")
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


class AdminPasswordUpdateRequest(BaseModel):
    passcode: str = Field(min_length=1)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def _require_auth(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    try:
        return jwt.decode(credentials.credentials, _JWT_SECRET, algorithms=[_JWT_ALGORITHM])
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


# Serializes read-modify-write sequences against `events_store`. Sync routes run
# in FastAPI's threadpool, so two concurrent POSTs targeting the same day could
# otherwise each see "2 events" before either appends, producing 4. Required
# while the store is in-memory; the production SQL migration should rely on a
# transaction (or BEFORE-INSERT trigger) for the same invariant.
_events_lock = threading.Lock()

# Same protection for the announcements store. There is no count cap to enforce,
# but the lock still guards PUT (lookup→modify) and DELETE (enumerate→pop)
# against concurrent mutation that could lose updates or pop the wrong index.
_announcements_lock = threading.Lock()

# Same protection for the photos store.
_photos_lock = threading.Lock()

# Same protection for the officers store.
_officers_lock = threading.Lock()

# Same protection for the members store.
_members_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def _member_to_response(m: dict) -> dict:
    return {
        "memberNumber": m["member_number"],
        "firstName": m["first_name"],
        "lastName": m["last_name"],
        "addressStreet": m["address_street"],
        "addressCity": m["address_city"],
        "addressState": m["address_state"],
        "addressZip": m["address_zip"],
        "phone": m["phone"],
        "birthday": m["birthday"],
        "officerPosition": m.get("officer_position"),
        "email": m["email"],
        "assemblyNumber": m.get("assembly_number"),
        "firstDegreeDate": m.get("first_degree_date"),
        "secondDegreeDate": m.get("second_degree_date"),
        "thirdDegreeDate": m.get("third_degree_date"),
        "fourthDegreeDate": m.get("fourth_degree_date"),
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


def _upcoming_birthdays(days: int = 30) -> list[dict]:
    today = date.today()
    cutoff = today + timedelta(days=days)
    result = []
    for m in members_store:
        if not m.get("birthday"):
            continue
        bday = date.fromisoformat(m["birthday"])
        for year in (today.year, today.year + 1):
            try:
                candidate = bday.replace(year=year)
            except ValueError:
                candidate = bday.replace(year=year, day=28)
            if today <= candidate <= cutoff:
                result.append(m)
                break
    return result


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login")
def login(body: LoginRequest):
    member = next((m for m in members_store if m["member_number"] == body.membershipNumber), None)
    if member is None or member.get("passcode") != body.passcode:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    is_admin = member.get("is_admin", False)
    token = jwt.encode(
        {
            "sub": member["member_number"],
            "isOfficer": _is_officer(member.get("officer_position")) or is_admin,
            "officerPosition": member.get("officer_position"),
            "isAdmin": is_admin,
        },
        _JWT_SECRET,
        algorithm=_JWT_ALGORITHM,
    )
    return {"token": token}


@app.get("/members/birthdays")
def get_birthdays(_payload: dict = Depends(_require_auth)):
    return [_member_to_response(m) for m in _upcoming_birthdays() if not _is_admin_member(m)]


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
    for m in members_store:
        if not _is_admin_member(m):
            writer.writerow(_member_to_response(m))
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=koc-830-members.csv"},
    )


@app.get("/members")
def get_members(_payload: dict = Depends(_require_auth)):
    return [_member_to_response(m) for m in members_store if not _is_admin_member(m)]


@app.get("/members/{member_id}")
def get_member(member_id: str, _payload: dict = Depends(_require_auth)):
    member = next((m for m in members_store if m["member_number"] == member_id), None)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if _is_admin_member(member) and not _payload.get("isAdmin"):
        raise HTTPException(status_code=404, detail="Member not found")
    return _member_to_response(member)


@app.put("/members/{member_id}")
def update_member(member_id: str, body: UpdateContactRequest, _payload: dict = Depends(_require_auth)):
    member = next((m for m in members_store if m["member_number"] == member_id), None)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if _is_admin_member(member) and not _payload.get("isAdmin"):
        raise HTTPException(status_code=403, detail="Cannot modify admin account.")
    member["address_street"] = body.addressStreet
    member["address_city"] = body.addressCity
    member["address_state"] = body.addressState
    member["address_zip"] = body.addressZip
    member["phone"] = body.phone
    member["email"] = body.email
    return {"success": True, "message": "Contact information updated."}


@app.post("/members", status_code=201)
def create_member(body: CreateMemberRequest, _payload: dict = Depends(_require_privileged_officer)):
    with _members_lock:
        existing = next((m for m in members_store if m["member_number"] == body.memberNumber), None)
        if existing is not None:
            raise HTTPException(status_code=409, detail="A member with that number already exists.")
        members_store.append({
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
            "officer_position": None,
            "assembly_number": body.assemblyNumber,
            "first_degree_date": body.firstDegreeDate,
            "second_degree_date": body.secondDegreeDate,
            "third_degree_date": body.thirdDegreeDate,
            "fourth_degree_date": body.fourthDegreeDate,
        })
    return {"success": True, "message": "Member added successfully."}


@app.put("/members/{member_id}/full")
def update_member_full(member_id: str, body: UpdateMemberFullRequest, _payload: dict = Depends(_require_privileged_officer)):
    with _members_lock:
        member = next((m for m in members_store if m["member_number"] == member_id), None)
        if member is None:
            raise HTTPException(status_code=404, detail="Member not found")
        if _is_admin_member(member) and not _payload.get("isAdmin"):
            raise HTTPException(status_code=403, detail="Cannot modify admin account.")
        if body.memberNumber != member_id:
            conflict = next((m for m in members_store if m["member_number"] == body.memberNumber), None)
            if conflict is not None:
                raise HTTPException(status_code=409, detail="A member with that number already exists.")
        member["member_number"] = body.memberNumber
        member["first_name"] = body.firstName
        member["last_name"] = body.lastName
        member["address_street"] = body.addressStreet
        member["address_city"] = body.addressCity
        member["address_state"] = body.addressState
        member["address_zip"] = body.addressZip
        member["phone"] = body.phone
        member["birthday"] = body.birthday
        member["email"] = body.email
        member["assembly_number"] = body.assemblyNumber
        member["first_degree_date"] = body.firstDegreeDate
        member["second_degree_date"] = body.secondDegreeDate
        member["third_degree_date"] = body.thirdDegreeDate
        member["fourth_degree_date"] = body.fourthDegreeDate
        if body.passcode:
            member["passcode"] = body.passcode
    return {"success": True, "message": "Member updated successfully."}


@app.delete("/members/{member_id}")
def delete_member(member_id: str, _payload: dict = Depends(_require_privileged_officer)):
    with _members_lock:
        idx = next((i for i, m in enumerate(members_store) if m["member_number"] == member_id), None)
        if idx is None:
            raise HTTPException(status_code=404, detail="Member not found")
        if _is_admin_member(members_store[idx]):
            raise HTTPException(status_code=403, detail="Cannot delete admin account.")
        removed = members_store.pop(idx)
    if removed.get("officer_position"):
        with _officers_lock:
            for officer in officers_store:
                if officer.get("member_number") == member_id:
                    officer["member_number"] = None
                    officer["name"] = None
                    officer["imageUrl"] = "/images/officers/default.png"
                    break
    return {"success": True, "message": "Member deleted successfully."}


@app.put("/admin/password")
def update_admin_password(body: AdminPasswordUpdateRequest, payload: dict = Depends(_require_auth)):
    if not payload.get("isAdmin"):
        raise HTTPException(status_code=403, detail="Admin access required.")
    with _members_lock:
        member = next((m for m in members_store if m["member_number"] == ADMIN_MEMBER_NUMBER), None)
        if member is None:
            raise HTTPException(status_code=404, detail="Admin account not found.")
        member["passcode"] = body.passcode
    return {"success": True, "message": "Password updated successfully."}


@app.get("/prayer-requests")
def get_prayer_requests(_payload: dict = Depends(_require_auth)):
    return [_prayer_request_to_response(r) for r in prayer_requests_store]


@app.get("/prayer-requests/public")
def get_prayer_requests_public():
    return [
        {"id": r["id"], "text": r.get("text", ""), "submittedAt": r["submitted_at"]}
        for r in prayer_requests_store
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
    prayer_requests_store.insert(0, record)
    logger.info("S3 stub: would write prayer request to %s", s3_key)
    return {"success": True, "message": "Prayer request submitted."}


@app.delete("/prayer-requests/{request_id}")
def delete_prayer_request(request_id: str, payload: dict = Depends(_require_auth)):
    for i, r in enumerate(prayer_requests_store):
        if r["id"] == request_id:
            if r["submitted_by"] != payload["sub"] and not payload.get("isOfficer"):
                raise HTTPException(status_code=403, detail="You can only delete your own prayer requests.")
            prayer_requests_store.pop(i)
            return {"success": True, "message": "Prayer request deleted."}
    raise HTTPException(status_code=404, detail="Prayer request not found.")


@app.get("/meeting-minutes")
def get_meeting_minutes(_payload: dict = Depends(_require_auth)):
    return [
        {"id": m["id"], "title": m["title"], "meetingDate": m["meeting_date"], "s3Key": m["s3_key"]}
        for m in meeting_minutes_store
    ]


@app.get("/meeting-minutes/{minutes_id}")
def get_meeting_minutes_detail(minutes_id: str, _payload: dict = Depends(_require_auth)):
    entry = next((m for m in meeting_minutes_store if m["id"] == minutes_id), None)
    if entry is None:
        raise HTTPException(status_code=404, detail="Meeting minutes not found")
    logger.info("S3 stub: would generate pre-signed URL for %s", entry["s3_key"])
    return {"id": entry["id"], "title": entry["title"], "meetingDate": entry["meeting_date"], "url": entry["s3_key"]}


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
        filtered = [e for e in events_store if e["day"].startswith(month)]
    else:
        filtered = list(events_store)
    return [_event_to_response(e) for e in filtered]


@app.post("/events")
def create_event(body: EventCreate, payload: dict = Depends(_require_officer)):
    new_id = str(uuid.uuid4())
    now = _now_iso()
    with _events_lock:
        same_day_count = sum(1 for e in events_store if e["day"] == body.day)
        if same_day_count >= 3:
            raise HTTPException(status_code=409, detail="This day already has the maximum of 3 events.")
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
        events_store.append(record)
    return {"success": True, "message": "Event created.", "id": new_id}


@app.put("/events/{event_id}")
def update_event(event_id: str, body: EventUpdate, payload: dict = Depends(_require_officer)):
    with _events_lock:
        record = next((e for e in events_store if e["id"] == event_id), None)
        if record is None:
            raise HTTPException(status_code=404, detail="Event not found.")
        if body.day != record["day"]:
            same_day_count = sum(1 for e in events_store if e["day"] == body.day and e["id"] != event_id)
            if same_day_count >= 3:
                raise HTTPException(status_code=409, detail="Target day already has the maximum of 3 events.")
        record["day"] = body.day
        record["title"] = body.title
        record["description"] = body.description
        record["time_of_day"] = body.timeOfDay
        record["location"] = body.location
        record["updated_at"] = _now_iso()
    return {"success": True, "message": "Event updated."}


@app.delete("/events/{event_id}")
def delete_event(event_id: str, _payload: dict = Depends(_require_officer)):
    with _events_lock:
        for i, e in enumerate(events_store):
            if e["id"] == event_id:
                events_store.pop(i)
                return {"success": True, "message": "Event deleted."}
    raise HTTPException(status_code=404, detail="Event not found.")


@app.get("/announcements")
def get_announcements():
    """List active announcements.

    Public (no auth). Returns announcements where ``delete_date >= today``,
    sorted by ``created_at`` descending (newest first; id ascending as a
    deterministic tiebreaker for identical timestamps).
    """
    today = _today()
    visible = [a for a in announcements_store if date.fromisoformat(a["delete_date"]) >= today]
    visible.sort(key=lambda a: (a["created_at"], a["id"]), reverse=True)
    return [_announcement_to_response(a) for a in visible]


@app.post("/announcements")
def create_announcement(body: AnnouncementCreate, payload: dict = Depends(_require_officer)):
    new_id = str(uuid.uuid4())
    now = _now_iso()
    with _announcements_lock:
        record = {
            "id": new_id,
            "title": body.title,
            "details": body.details,
            "delete_date": body.deleteDate,
            "created_by": payload["sub"],
            "created_at": now,
            "updated_at": now,
        }
        announcements_store.append(record)
    return {"success": True, "message": "Announcement created.", "id": new_id}


@app.put("/announcements/{announcement_id}")
def update_announcement(
    announcement_id: str,
    body: AnnouncementUpdate,
    _payload: dict = Depends(_require_officer),
):
    with _announcements_lock:
        record = next((a for a in announcements_store if a["id"] == announcement_id), None)
        if record is None:
            raise HTTPException(status_code=404, detail="Announcement not found.")
        record["title"] = body.title
        record["details"] = body.details
        record["delete_date"] = body.deleteDate
        record["updated_at"] = _now_iso()
    return {"success": True, "message": "Announcement updated."}


@app.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: str, _payload: dict = Depends(_require_officer)):
    with _announcements_lock:
        for i, a in enumerate(announcements_store):
            if a["id"] == announcement_id:
                announcements_store.pop(i)
                return {"success": True, "message": "Announcement deleted."}
    raise HTTPException(status_code=404, detail="Announcement not found.")


@app.get("/photos")
def get_photos():
    """List all photos in the gallery.

    Public (no auth). Returns photos sorted by ``created_at`` ascending
    (oldest first; id ascending as a deterministic tiebreaker), so the
    most recently added photo appears at the bottom of the two-column grid.
    """
    ordered = sorted(photos_store, key=lambda p: (p["created_at"], p["id"]))
    return [_photo_to_response(p) for p in ordered]


@app.post("/photos")
def create_photo(body: PhotoCreate, payload: dict = Depends(_require_officer)):
    new_id = str(uuid.uuid4())
    now = _now_iso_precise()
    with _photos_lock:
        record = {
            "id": new_id,
            "title": body.title,
            "photo_url": body.photoUrl,
            "created_by": payload["sub"],
            "created_at": now,
            "updated_at": now,
        }
        photos_store.append(record)
    return {"success": True, "message": "Photo added.", "id": new_id}


@app.put("/photos/{photo_id}")
def update_photo(
    photo_id: str,
    body: PhotoUpdate,
    _payload: dict = Depends(_require_officer),
):
    with _photos_lock:
        record = next((p for p in photos_store if p["id"] == photo_id), None)
        if record is None:
            raise HTTPException(status_code=404, detail="Photo not found.")
        record["title"] = body.title
        record["photo_url"] = body.photoUrl
        record["updated_at"] = _now_iso_precise()
    return {"success": True, "message": "Photo updated."}


@app.delete("/photos/{photo_id}")
def delete_photo(photo_id: str, _payload: dict = Depends(_require_officer)):
    with _photos_lock:
        for i, p in enumerate(photos_store):
            if p["id"] == photo_id:
                photos_store.pop(i)
                return {"success": True, "message": "Photo deleted."}
    raise HTTPException(status_code=404, detail="Photo not found.")


@app.get("/officers")
def get_officers(request: Request):
    """List the current officer roster.

    Public (no auth). Returns officers in the canonical title order defined by
    OFFICER_TITLES_ORDERED. Photos that have been uploaded are served from the
    backend; their URLs are returned as absolute paths using the request's base.
    """
    base = str(request.base_url).rstrip("/")
    result = []
    for o in officers_store:
        if o.get("photo_data"):
            photo_url = f"{base}{o['photo_url']}"
        else:
            photo_url = o["photo_url"]
        result.append({"title": o["title"], "name": o["name"], "photoUrl": photo_url})
    return result


@app.put("/officers/{title}")
def update_officer(title: str, body: OfficerUpdateRequest, payload: dict = Depends(_require_privileged_officer)):
    if title not in OFFICER_TITLES:
        raise HTTPException(status_code=404, detail="Officer title not found.")
    member = next((m for m in members_store if m["member_number"] == body.memberNumber), None)
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
    with _officers_lock:
        officer_entry = next((o for o in officers_store if o["title"] == title), None)
        if officer_entry is None:
            raise HTTPException(status_code=404, detail="Officer title not found.")
        old_member_number = officer_entry["member_number"]
        if old_member_number and old_member_number != body.memberNumber:
            old_member = next((m for m in members_store if m["member_number"] == old_member_number), None)
            if old_member:
                old_member["officer_position"] = None
        member["officer_position"] = title
        slug = title.lower().replace(" ", "-").replace("---", "-")
        officer_entry["member_number"] = body.memberNumber
        officer_entry["name"] = f"{member['first_name']} {member['last_name']}"
        officer_entry["photo_url"] = f"/officers/photos/{slug}.png"
        officer_entry["photo_data"] = body.photoData
    return {"success": True, "message": "Officer updated."}


@app.get("/officers/photos/{filename}")
def get_officer_photo(filename: str):
    slug = filename.removesuffix(".png")
    for o in officers_store:
        entry_slug = o["title"].lower().replace(" ", "-").replace("---", "-")
        if entry_slug == slug and o.get("photo_data"):
            photo_bytes = base64.b64decode(o["photo_data"])
            return Response(content=photo_bytes, media_type="image/png")
    raise HTTPException(status_code=404, detail="Officer photo not found.")


@app.post("/emails/officer")
def email_officer(body: EmailOfficerRequest, payload: dict = Depends(_require_auth)):
    officer = next((m for m in members_store if m.get("officer_position") == body.officerTitle), None)
    if officer is None:
        raise HTTPException(status_code=404, detail="Officer not found")
    sender = next((m for m in members_store if m["member_number"] == payload["sub"]), None)
    sender_name = f"{sender['first_name']} {sender['last_name']}" if sender else "A council member"
    _send_email(
        officer["email"],
        f"Message from {sender_name}",
        body.message,
    )
    return {"success": True, "message": "Your message has been sent."}


@app.post("/nominations")
def submit_nomination(body: NominationRequest, _payload: dict = Depends(_require_auth)):
    officer_emails = [m["email"] for m in members_store if _is_officer(m.get("officer_position"))]
    nomination_body = (
        f"Knight of the Month: {body.knightOfMonth}\n"
        f"Family of the Month: {body.familyOfMonth}"
    )
    _send_email(officer_emails, "Knight and Family of the Month Nomination", nomination_body)
    return {"success": True, "message": "Nomination submitted to council officers."}


@app.post("/emails/all-members")
def email_all_members(body: EmailAllMembersRequest, _payload: dict = Depends(_require_officer)):
    all_emails = [m["email"] for m in members_store if not _is_admin_member(m)]
    _send_email(all_emails, "Message from Council 830 Officers", body.message)
    return {"success": True, "message": "Message sent to all members."}

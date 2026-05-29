import csv
import io
import logging
import os
import threading
import uuid
from datetime import date, time, timedelta

import httpx
import jwt
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

from app.seed import (
    announcements_store,
    events_store,
    meeting_minutes_store,
    members_store,
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


def _is_officer(officer_position: str | None) -> bool:
    return officer_position in OFFICER_TITLES


def _today() -> date:
    return date.today()


def _now_iso() -> str:
    return _today().isoformat() + "T00:00:00Z"


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
    token = jwt.encode(
        {"sub": member["member_number"], "isOfficer": _is_officer(member.get("officer_position"))},
        _JWT_SECRET,
        algorithm=_JWT_ALGORITHM,
    )
    return {"token": token}


@app.get("/members/birthdays")
def get_birthdays(_payload: dict = Depends(_require_auth)):
    return [_member_to_response(m) for m in _upcoming_birthdays()]


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
        writer.writerow(_member_to_response(m))
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=koc-830-members.csv"},
    )


@app.get("/members")
def get_members(_payload: dict = Depends(_require_auth)):
    return [_member_to_response(m) for m in members_store]


@app.get("/members/{member_id}")
def get_member(member_id: str, _payload: dict = Depends(_require_auth)):
    member = next((m for m in members_store if m["member_number"] == member_id), None)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return _member_to_response(member)


@app.put("/members/{member_id}")
def update_member(member_id: str, body: UpdateContactRequest, _payload: dict = Depends(_require_auth)):
    member = next((m for m in members_store if m["member_number"] == member_id), None)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    member["address_street"] = body.addressStreet
    member["address_city"] = body.addressCity
    member["address_state"] = body.addressState
    member["address_zip"] = body.addressZip
    member["phone"] = body.phone
    member["email"] = body.email
    return {"success": True, "message": "Contact information updated."}


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
    all_emails = [m["email"] for m in members_store]
    _send_email(all_emails, "Message from Council 830 Officers", body.message)
    return {"success": True, "message": "Message sent to all members."}

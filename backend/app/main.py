import csv
import io
import logging
import os
import uuid
from datetime import date, timedelta

import httpx
import jwt
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.seed import meeting_minutes_store, members_store, prayer_requests_store

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
    text: str

class EmailOfficerRequest(BaseModel):
    officerTitle: str
    message: str

class EmailAllMembersRequest(BaseModel):
    message: str

class NominationRequest(BaseModel):
    knightOfMonth: str
    familyOfMonth: str


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

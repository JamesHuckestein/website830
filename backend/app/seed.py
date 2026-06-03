import copy
import json
from pathlib import Path

_SCHEMA_PATH = Path(__file__).parent.parent.parent / "docs" / "schema.json"

with open(_SCHEMA_PATH) as _f:
    _ORIGINAL: dict = json.load(_f)

OFFICER_TITLES_ORDERED = [
    "Grand Knight",
    "Deputy Grand Knight",
    "Chancellor",
    "Advocate",
    "Recorder",
    "Treasurer",
    "Warden",
    "Inside Guard",
    "Outside Guard",
    "Trustee - 1 Year",
    "Trustee - 2 Year",
    "Trustee - 3 Year",
    "Financial Secretary",
    "Lecturer",
]

_OFFICER_PHOTO_MAP: dict[str, str] = {
    "Grand Knight": "/officers/john-h-akers.png",
    "Deputy Grand Knight": "/officers/james-h.png",
    "Chancellor": "/officers/Riley.png",
    "Advocate": "/officers/Radcliffe.png",
    "Recorder": "/officers/Grahek.png",
    "Treasurer": "/officers/Manning.png",
    "Warden": "/officers/Schindler.png",
    "Inside Guard": "/officers/Gunnels.png",
    "Outside Guard": "/officers/Ventura.png",
    "Trustee - 1 Year": "/officers/Sheets.png",
    "Trustee - 2 Year": "/officers/Ventura.png",
    "Trustee - 3 Year": "/officers/Ventura.png",
    "Financial Secretary": "/officers/Steele.png",
    "Lecturer": "/officers/Ventura.png",
}


def _build_officers_store(members: list[dict]) -> list[dict]:
    officers = []
    for title in OFFICER_TITLES_ORDERED:
        member = next((m for m in members if m.get("officer_position") == title), None)
        if member:
            officers.append({
                "title": title,
                "member_number": member["member_number"],
                "name": f"{member['first_name']} {member['last_name']}",
                "photo_url": _OFFICER_PHOTO_MAP.get(title, "/officers/placeholder.png"),
            })
        else:
            officers.append({
                "title": title,
                "member_number": None,
                "name": "Vacant",
                "photo_url": "/officers/placeholder.png",
            })
    return officers


# Mutable in-memory stores — mutated by PUT/POST endpoints at runtime
members_store: list[dict] = copy.deepcopy(_ORIGINAL["members"])
prayer_requests_store: list[dict] = copy.deepcopy(_ORIGINAL["prayer_requests"])
meeting_minutes_store: list[dict] = copy.deepcopy(_ORIGINAL["meeting_minutes"])
events_store: list[dict] = copy.deepcopy(_ORIGINAL["events"])
announcements_store: list[dict] = copy.deepcopy(_ORIGINAL["announcements"])
photos_store: list[dict] = copy.deepcopy(_ORIGINAL["photos"])
officers_store: list[dict] = _build_officers_store(members_store)


def reset_to_seed() -> None:
    """Restore all stores to the original seed data. Used by tests."""
    members_store.clear()
    members_store.extend(copy.deepcopy(_ORIGINAL["members"]))
    prayer_requests_store.clear()
    prayer_requests_store.extend(copy.deepcopy(_ORIGINAL["prayer_requests"]))
    meeting_minutes_store.clear()
    meeting_minutes_store.extend(copy.deepcopy(_ORIGINAL["meeting_minutes"]))
    events_store.clear()
    events_store.extend(copy.deepcopy(_ORIGINAL["events"]))
    announcements_store.clear()
    announcements_store.extend(copy.deepcopy(_ORIGINAL["announcements"]))
    photos_store.clear()
    photos_store.extend(copy.deepcopy(_ORIGINAL["photos"]))
    officers_store.clear()
    officers_store.extend(_build_officers_store(members_store))

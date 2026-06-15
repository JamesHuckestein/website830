"""Seed DynamoDB tables from docs/schema.json and the Admin record.

Usage:
    cd backend
    .venv/bin/python -m scripts.seed_dynamo

Environment variables:
    DYNAMO_TABLE_PREFIX  — table name prefix (default: koc830-dev-)
    DYNAMO_ENDPOINT_URL  — endpoint override for DynamoDB Local (default: None)
    AWS_REGION           — AWS region (default: us-east-1)
"""

import copy
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.dynamo import batch_write, get_item, scan_table

_SCHEMA_PATH = Path(__file__).parent.parent.parent / "docs" / "schema.json"

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

_OFFICER_PHOTO_MAP = {
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
    "Lecturer": "/officers/PhilKay.png",
}

ADMIN_RECORD = {
    "member_number": "830999999",
    "first_name": "Admin",
    "last_name": "Account",
    "address_street": None,
    "address_city": None,
    "address_state": None,
    "address_zip": None,
    "phone": None,
    "birthday": None,
    "officer_position": None,
    "email": "",
    "assembly_number": None,
    "first_degree_date": None,
    "second_degree_date": None,
    "third_degree_date": None,
    "fourth_degree_date": None,
    "passcode": "JesusisLord1!",
    "is_admin": True,
}


def _strip_none(d: dict) -> dict:
    """Remove keys with None values — DynamoDB doesn't store nulls natively.
    Use attribute absence to represent null.
    """
    return {k: v for k, v in d.items() if v is not None}


def _build_officers(members: list[dict]) -> list[dict]:
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
                "name": "Vacant",
                "photo_url": "/officers/placeholder.png",
            })
    return officers


def seed():
    print(f"Loading seed data from {_SCHEMA_PATH}")
    with open(_SCHEMA_PATH) as f:
        data = json.load(f)

    prefix = os.getenv("DYNAMO_TABLE_PREFIX", "koc830-dev-")
    endpoint = os.getenv("DYNAMO_ENDPOINT_URL", "")
    print(f"Table prefix: {prefix}")
    if endpoint:
        print(f"Endpoint: {endpoint}")

    members = data["members"]
    members_with_admin = members + [copy.deepcopy(ADMIN_RECORD)]

    # Seed Members
    existing = scan_table("members")
    if existing:
        print(f"  members: already has {len(existing)} items — skipping")
    else:
        items = [_strip_none(m) for m in members_with_admin]
        batch_write("members", items)
        print(f"  members: seeded {len(items)} items")

    # Seed Officers
    existing = scan_table("officers")
    if existing:
        print(f"  officers: already has {len(existing)} items — skipping")
    else:
        officers = _build_officers(members)
        items = [_strip_none(o) for o in officers]
        batch_write("officers", items)
        print(f"  officers: seeded {len(items)} items")

    # Seed Events
    existing = scan_table("events")
    if existing:
        print(f"  events: already has {len(existing)} items — skipping")
    else:
        items = [_strip_none(e) for e in data["events"]]
        batch_write("events", items)
        print(f"  events: seeded {len(items)} items")

    # Seed Announcements
    existing = scan_table("announcements")
    if existing:
        print(f"  announcements: already has {len(existing)} items — skipping")
    else:
        items = [_strip_none(a) for a in data["announcements"]]
        batch_write("announcements", items)
        print(f"  announcements: seeded {len(items)} items")

    # Seed Photos
    existing = scan_table("photos")
    if existing:
        print(f"  photos: already has {len(existing)} items — skipping")
    else:
        items = [_strip_none(p) for p in data["photos"]]
        batch_write("photos", items)
        print(f"  photos: seeded {len(items)} items")

    # Seed Prayer Requests
    existing = scan_table("prayer-requests")
    if existing:
        print(f"  prayer-requests: already has {len(existing)} items — skipping")
    else:
        items = [_strip_none(r) for r in data["prayer_requests"]]
        batch_write("prayer-requests", items)
        print(f"  prayer-requests: seeded {len(items)} items")

    # Seed Meeting Minutes
    existing = scan_table("meeting-minutes")
    if existing:
        print(f"  meeting-minutes: already has {len(existing)} items — skipping")
    else:
        items = [_strip_none(m) for m in data["meeting_minutes"]]
        batch_write("meeting-minutes", items)
        print(f"  meeting-minutes: seeded {len(items)} items")

    print("Done.")


if __name__ == "__main__":
    seed()

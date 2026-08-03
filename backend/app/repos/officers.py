from app.dynamo import get_item, scan_table, update_item

TABLE = "officers"

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


def list_all() -> list[dict]:
    """Return all 14 officer slots in canonical title order."""
    items = scan_table(TABLE)
    by_title = {o["title"]: o for o in items}
    return [by_title[t] for t in OFFICER_TITLES_ORDERED if t in by_title]


def get_by_title(title: str) -> dict | None:
    return get_item(TABLE, {"title": title})


def update_assignment(title: str, member_number: str, name: str, photo_url: str, photo_data: bytes | None = None) -> dict | None:
    updates: dict = {
        "member_number": member_number,
        "name": name,
        "photo_url": photo_url,
    }
    if photo_data is not None:
        updates["photo_data"] = photo_data
    return update_item(TABLE, {"title": title}, updates)


def clear_slot(title: str) -> dict | None:
    return update_item(TABLE, {"title": title}, {
        "member_number": None,
        "name": "Vacant",
        "photo_url": "/officers/placeholder.png",
        "photo_data": None,
    })


def swap_officer(title: str, new_member_number: str, new_name: str, photo_url: str, photo_data: bytes,
                 old_member_number: str | None = None) -> bool:
    """Assign a new officer: update officer slot + update member positions."""
    updates: dict = {
        "member_number": new_member_number,
        "name": new_name,
        "photo_url": photo_url,
        "photo_data": photo_data,
    }
    update_item(TABLE, {"title": title}, updates)

    from app.repos.members import set_officer_position, clear_officer_position
    set_officer_position(new_member_number, title)
    if old_member_number and old_member_number != new_member_number:
        clear_officer_position(old_member_number)
    return True


def get_photo_by_slug(slug: str) -> bytes | None:
    """Find officer photo data by URL slug."""
    items = scan_table(TABLE)
    for o in items:
        title_slug = o["title"].lower().replace(" ", "-").replace("---", "-")
        if title_slug == slug and o.get("photo_data"):
            return o["photo_data"]
    return None

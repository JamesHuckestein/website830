from app.dynamo import delete_item, get_item, put_item, scan_table, update_item

TABLE = "photos"


def list_all() -> list[dict]:
    """Return all photos sorted oldest-first (by created_at ASC, id ASC as tiebreaker)."""
    items = scan_table(TABLE)
    items.sort(key=lambda p: (p.get("created_at", ""), p.get("id", "")))
    return items


def get_by_id(photo_id: str) -> dict | None:
    return get_item(TABLE, {"id": photo_id})


def create(photo: dict) -> None:
    put_item(TABLE, photo)


def update(photo_id: str, fields: dict) -> dict | None:
    return update_item(TABLE, {"id": photo_id}, fields)


def delete(photo_id: str) -> bool:
    return delete_item(TABLE, {"id": photo_id})

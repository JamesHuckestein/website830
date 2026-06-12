from app.dynamo import delete_item, get_item, put_item, scan_table

TABLE = "prayer-requests"


def list_all() -> list[dict]:
    """Return all prayer requests sorted newest-first."""
    items = scan_table(TABLE)
    items.sort(key=lambda r: r.get("submitted_at", ""), reverse=True)
    return items


def list_public() -> list[dict]:
    """Return all prayer requests with only public fields (id, text, submitted_at)."""
    items = scan_table(TABLE, projection=["id", "text", "submitted_at"])
    items.sort(key=lambda r: r.get("submitted_at", ""), reverse=True)
    return items


def get_by_id(request_id: str) -> dict | None:
    return get_item(TABLE, {"id": request_id})


def create(request: dict) -> None:
    put_item(TABLE, request)


def delete(request_id: str) -> bool:
    return delete_item(TABLE, {"id": request_id})

from app.dynamo import get_item, scan_table

TABLE = "meeting-minutes"


def list_all() -> list[dict]:
    return scan_table(TABLE)


def get_by_id(minutes_id: str) -> dict | None:
    return get_item(TABLE, {"id": minutes_id})

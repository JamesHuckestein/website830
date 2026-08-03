from app.dynamo import delete_item, get_item, put_item, scan_table

TABLE = "meeting-minutes"


def list_all() -> list[dict]:
    return scan_table(TABLE)


def get_by_id(minutes_id: str) -> dict | None:
    return get_item(TABLE, {"id": minutes_id})


def create(record: dict) -> None:
    put_item(TABLE, record)


def delete(minutes_id: str) -> bool:
    return delete_item(TABLE, {"id": minutes_id})

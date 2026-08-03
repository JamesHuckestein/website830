from app.dynamo import delete_item, get_item, put_item, scan_table, update_item
from boto3.dynamodb.conditions import Attr

TABLE = "announcements"


def list_active(today_iso: str) -> list[dict]:
    """Return announcements where delete_date >= today, sorted newest-first."""
    items = scan_table(TABLE, filter_expression=Attr("delete_date").gte(today_iso))
    items.sort(key=lambda a: (a.get("created_at", ""), a.get("id", "")), reverse=True)
    return items


def get_by_id(announcement_id: str) -> dict | None:
    return get_item(TABLE, {"id": announcement_id})


def create(announcement: dict) -> None:
    put_item(TABLE, announcement)


def update(announcement_id: str, fields: dict) -> dict | None:
    return update_item(TABLE, {"id": announcement_id}, fields)


def delete(announcement_id: str) -> bool:
    return delete_item(TABLE, {"id": announcement_id})

from app.dynamo import delete_item, get_item, put_item, query_index, scan_table, update_item
from boto3.dynamodb.conditions import Key

TABLE = "events"
DAY_INDEX = "day-index"


def list_all() -> list[dict]:
    return scan_table(TABLE)


def list_by_month(month: str) -> list[dict]:
    """Return events whose day starts with the given YYYY-MM prefix."""
    from boto3.dynamodb.conditions import Attr
    return scan_table(TABLE, filter_expression=Attr("day").begins_with(month))


def count_by_day(day: str) -> int:
    items = query_index(TABLE, DAY_INDEX, Key("day").eq(day))
    return len(items)


def get_by_id(event_id: str) -> dict | None:
    return get_item(TABLE, {"id": event_id})


def create(event: dict) -> None:
    put_item(TABLE, event)


def update(event_id: str, fields: dict) -> dict | None:
    return update_item(TABLE, {"id": event_id}, fields)


def delete(event_id: str) -> bool:
    return delete_item(TABLE, {"id": event_id})

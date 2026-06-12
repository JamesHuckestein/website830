import os
from typing import Any

import boto3
from boto3.dynamodb.conditions import Attr, Key

_TABLE_PREFIX = os.getenv("DYNAMO_TABLE_PREFIX", "koc830-dev-")
_ENDPOINT_URL = os.getenv("DYNAMO_ENDPOINT_URL")
_REGION = os.getenv("AWS_REGION", "us-east-1")


def _resource():
    kwargs: dict[str, Any] = {"region_name": _REGION}
    if _ENDPOINT_URL:
        kwargs["endpoint_url"] = _ENDPOINT_URL
    return boto3.resource("dynamodb", **kwargs)


def _table(name: str):
    return _resource().Table(f"{_TABLE_PREFIX}{name}")


def get_item(table_name: str, key: dict) -> dict | None:
    resp = _table(table_name).get_item(Key=key)
    return resp.get("Item")


def put_item(table_name: str, item: dict) -> None:
    _table(table_name).put_item(Item=item)


def put_item_unique(table_name: str, item: dict, pk_field: str) -> bool:
    """PutItem with a condition that the partition key does not already exist.
    Returns True on success, False if the item already exists.
    """
    try:
        _table(table_name).put_item(
            Item=item,
            ConditionExpression=Attr(pk_field).not_exists(),
        )
        return True
    except _resource().meta.client.exceptions.ConditionalCheckFailedException:
        return False


def update_item(table_name: str, key: dict, updates: dict) -> dict | None:
    if not updates:
        return get_item(table_name, key)
    expr_parts = []
    names = {}
    values = {}
    for i, (field, value) in enumerate(updates.items()):
        placeholder = f"#f{i}"
        val_placeholder = f":v{i}"
        expr_parts.append(f"{placeholder} = {val_placeholder}")
        names[placeholder] = field
        values[val_placeholder] = value
    resp = _table(table_name).update_item(
        Key=key,
        UpdateExpression="SET " + ", ".join(expr_parts),
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
        ReturnValues="ALL_NEW",
    )
    return resp.get("Attributes")


def delete_item(table_name: str, key: dict) -> bool:
    """Delete an item. Returns True if it existed, False otherwise."""
    resp = _table(table_name).delete_item(Key=key, ReturnValues="ALL_OLD")
    return "Attributes" in resp


def scan_table(table_name: str, filter_expression=None, projection: list[str] | None = None) -> list[dict]:
    kwargs: dict[str, Any] = {}
    if filter_expression is not None:
        kwargs["FilterExpression"] = filter_expression
    if projection:
        kwargs["ProjectionExpression"] = ", ".join(f"#p{i}" for i in range(len(projection)))
        kwargs["ExpressionAttributeNames"] = {f"#p{i}": name for i, name in enumerate(projection)}
    items = []
    table = _table(table_name)
    resp = table.scan(**kwargs)
    items.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
        kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
        resp = table.scan(**kwargs)
        items.extend(resp.get("Items", []))
    return items


def query_index(table_name: str, index_name: str, key_condition, filter_expression=None) -> list[dict]:
    kwargs: dict[str, Any] = {
        "IndexName": index_name,
        "KeyConditionExpression": key_condition,
    }
    if filter_expression is not None:
        kwargs["FilterExpression"] = filter_expression
    items = []
    table = _table(table_name)
    resp = table.query(**kwargs)
    items.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
        kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
        resp = table.query(**kwargs)
        items.extend(resp.get("Items", []))
    return items


def transact_write(operations: list[dict]) -> bool:
    """Execute a DynamoDB TransactWriteItems call.

    Each operation is a dict with one key: 'Put', 'Update', or 'Delete',
    whose value is the params for that operation type.
    Returns True on success, raises on failure.
    """
    client = _resource().meta.client
    client.transact_write_items(TransactItems=operations)
    return True


def batch_write(table_name: str, items: list[dict]) -> None:
    """Batch write up to 25 items at a time (for seeding)."""
    table = _table(table_name)
    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)

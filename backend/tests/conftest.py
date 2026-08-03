"""Pytest fixtures: moto-mocked DynamoDB tables seeded from schema.json."""

import os

os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
os.environ.setdefault("DYNAMO_TABLE_PREFIX", "koc830-test-")

import boto3
import pytest
from moto import mock_aws

TABLE_PREFIX = "koc830-test-"

_TABLE_DEFS = [
    {
        "TableName": f"{TABLE_PREFIX}members",
        "KeySchema": [{"AttributeName": "member_number", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "member_number", "AttributeType": "S"},
            {"AttributeName": "officer_position", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "officer_position-index",
                "KeySchema": [{"AttributeName": "officer_position", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": f"{TABLE_PREFIX}officers",
        "KeySchema": [{"AttributeName": "title", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "title", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": f"{TABLE_PREFIX}events",
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "day", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "day-index",
                "KeySchema": [
                    {"AttributeName": "day", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": f"{TABLE_PREFIX}announcements",
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": f"{TABLE_PREFIX}photos",
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": f"{TABLE_PREFIX}prayer-requests",
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": f"{TABLE_PREFIX}meeting-minutes",
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
]


def _create_tables():
    client = boto3.client("dynamodb", region_name="us-east-1")
    for defn in _TABLE_DEFS:
        client.create_table(**defn)


def _seed_tables():
    from scripts.seed_dynamo import seed
    seed()


@pytest.fixture(autouse=True)
def dynamo_tables():
    """Create moto-mocked DynamoDB tables and seed them for each test."""
    from app.dynamo import _reset_resource
    with mock_aws():
        _reset_resource()
        _create_tables()
        _seed_tables()
        yield
        _reset_resource()

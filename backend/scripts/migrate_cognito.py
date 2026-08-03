"""Bulk-create Cognito users from DynamoDB members table.

Usage:
    cd backend
    .venv/bin/python -m scripts.migrate_cognito

Environment variables:
    COGNITO_USER_POOL_ID  — target User Pool ID
    COGNITO_APP_CLIENT_ID — app client ID (for setting permanent passwords)
    AWS_REGION            — AWS region (default: us-east-1)
    DYNAMO_TABLE_PREFIX   — DynamoDB table prefix (default: koc830-prod-)
    DEFAULT_PASSWORD      — initial password for all users (default: Koc830!Pass)
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import boto3

_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID")
_CLIENT_ID = os.environ.get("COGNITO_APP_CLIENT_ID")
_REGION = os.getenv("AWS_REGION", "us-east-1")
_DEFAULT_PASSWORD = os.getenv("DEFAULT_PASSWORD", "Koc830!Pass")


def migrate():
    if not _POOL_ID:
        print("Error: COGNITO_USER_POOL_ID not set")
        sys.exit(1)

    from app.dynamo import scan_table

    cognito = boto3.client("cognito-idp", region_name=_REGION)

    members = scan_table("members")
    print(f"Found {len(members)} members in DynamoDB")

    created = 0
    skipped = 0
    errors = 0

    for m in members:
        member_number = m["member_number"]
        email = m.get("email", "").strip()

        user_attrs = []
        if email:
            user_attrs.append({"Name": "email", "Value": email})
            user_attrs.append({"Name": "email_verified", "Value": "true"})

        try:
            cognito.admin_create_user(
                UserPoolId=_POOL_ID,
                Username=member_number,
                UserAttributes=user_attrs,
                TemporaryPassword=_DEFAULT_PASSWORD,
                MessageAction="SUPPRESS",
            )
            cognito.admin_set_user_password(
                UserPoolId=_POOL_ID,
                Username=member_number,
                Password=_DEFAULT_PASSWORD,
                Permanent=True,
            )
            created += 1
        except cognito.exceptions.UsernameExistsException:
            skipped += 1
        except Exception as e:
            print(f"  Error creating {member_number}: {e}")
            errors += 1

    print(f"\nResults: {created} created, {skipped} already existed, {errors} errors")
    print(f"Default password for all new users: {_DEFAULT_PASSWORD}")
    print("Users can log in with their member number and this password.")


if __name__ == "__main__":
    migrate()

"""
Lambda function: receives a JSON payload {to, subject, body} and sends via SES.

Environment variables (set in the Lambda console):
  FROM_ADDRESS  — verified SES sender address (e.g. noreply@koc830.org)
"""
import json
import os

import boto3

_ses = boto3.client("ses", region_name="us-east-1")
_FROM = os.environ["FROM_ADDRESS"]


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except (ValueError, TypeError):
        return {"statusCode": 400, "body": json.dumps({"error": "invalid JSON"})}

    to = body.get("to")
    subject = body.get("subject", "(no subject)")
    text = body.get("body", "")

    if not to:
        return {"statusCode": 400, "body": json.dumps({"error": "to is required"})}

    recipients = [to] if isinstance(to, str) else list(to)

    for address in recipients:
        _ses.send_email(
            Source=_FROM,
            Destination={"ToAddresses": [address]},
            Message={
                "Subject": {"Data": subject},
                "Body": {"Text": {"Data": text}},
            },
        )

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"success": True, "count": len(recipients)}),
    }

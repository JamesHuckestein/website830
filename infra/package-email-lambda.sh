#!/bin/bash
set -euo pipefail

# Package the email Lambda handler and upload to S3.
#
# Usage:
#   ./infra/package-email-lambda.sh [s3-bucket] [s3-key]

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="${1:-koc830-assets}"
KEY="${2:-lambda/email-handler.zip}"
REGION="${AWS_REGION:-us-east-1}"
ZIP_PATH="$ROOT/infra/email-lambda.zip"

echo "Packaging email Lambda..."
cd "$ROOT/backend/lambda"
zip -q "$ZIP_PATH" email_handler.py

ZIP_SIZE=$(du -h "$ZIP_PATH" | cut -f1)
echo "  Zip created: $ZIP_PATH ($ZIP_SIZE)"

echo "  Uploading to s3://$BUCKET/$KEY..."
aws s3 cp "$ZIP_PATH" "s3://$BUCKET/$KEY" --region "$REGION"

echo "Done. S3 location: s3://$BUCKET/$KEY"

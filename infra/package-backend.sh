#!/bin/bash
set -euo pipefail

# Package the FastAPI backend into a Lambda deployment zip and upload to S3.
#
# Usage:
#   ./infra/package-backend.sh [s3-bucket] [s3-key]
#
# Defaults:
#   bucket: koc830-assets
#   key: lambda/backend-latest.zip

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="${1:-koc830-assets}"
KEY="${2:-lambda/backend-latest.zip}"
REGION="${AWS_REGION:-us-east-1}"
BUILD_DIR=$(mktemp -d)
ZIP_PATH="$ROOT/infra/backend-lambda.zip"

echo "Packaging backend Lambda..."
echo "  Build dir: $BUILD_DIR"

"$ROOT/backend/.venv/bin/pip" install --quiet --target "$BUILD_DIR" \
    --platform manylinux2014_x86_64 \
    --implementation cp \
    --python-version 3.13 \
    --only-binary=:all: \
    "fastapi>=0.115" \
    "mangum>=0.19" \
    "pyjwt>=2.10" \
    "python-jose[cryptography]>=3.3" \
    "python-multipart>=0.0.9" \
    "httpx>=0.27" \
    "boto3>=1.35"

cp -r "$ROOT/backend/app" "$BUILD_DIR/app"

cd "$BUILD_DIR"
zip -q -r "$ZIP_PATH" . -x "*.pyc" -x "__pycache__/*" -x "*.dist-info/*"
cd "$ROOT"

ZIP_SIZE=$(du -h "$ZIP_PATH" | cut -f1)
echo "  Zip created: $ZIP_PATH ($ZIP_SIZE)"

echo "  Uploading to s3://$BUCKET/$KEY..."
aws s3 cp "$ZIP_PATH" "s3://$BUCKET/$KEY" --region "$REGION"

rm -rf "$BUILD_DIR"
echo "Done. S3 location: s3://$BUCKET/$KEY"

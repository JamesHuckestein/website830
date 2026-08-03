#!/bin/bash
set -euo pipefail

# Build and deploy the frontend static site to S3, then invalidate CloudFront cache.
#
# Usage:
#   ./infra/deploy-frontend.sh
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Node.js and npm installed
#   - CloudFront stack already deployed (infra/s3-frontend.yaml)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="koc830-frontend"
STACK="koc830-frontend-cdn"
REGION="${AWS_REGION:-us-east-1}"

echo "Building frontend..."
cd "$ROOT/frontend"
npm run build

echo ""
echo "Syncing to s3://$BUCKET/..."
aws s3 sync "$ROOT/frontend/out/" "s3://$BUCKET/" \
    --delete \
    --region "$REGION"

echo ""
echo "Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
    --output text)

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --region "$REGION" \
        --output text
    echo "Cache invalidation initiated for distribution $DISTRIBUTION_ID"
else
    echo "Warning: No CloudFront distribution found. Skipping invalidation."
fi

echo ""
DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
    --output text 2>/dev/null || echo "")

if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "None" ]; then
    echo "Frontend deployed: $DOMAIN"
else
    echo "Frontend deployed to s3://$BUCKET/"
fi

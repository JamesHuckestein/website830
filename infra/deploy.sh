#!/bin/bash
set -euo pipefail

# Deploy DynamoDB tables and IAM role via CloudFormation, then seed data.
#
# Usage:
#   ./infra/deploy.sh              # deploys with default prefix (koc830-dev-)
#   ./infra/deploy.sh koc830-prod- # deploys with production prefix
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Python venv set up in backend/ with boto3 installed

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREFIX="${1:-koc830-dev-}"
REGION="${AWS_REGION:-us-east-1}"
STACK_TABLES="${PREFIX}dynamodb-tables"
STACK_IAM="${PREFIX}iam"

echo "Deploying with prefix: $PREFIX"
echo "Region: $REGION"
echo ""

# Deploy DynamoDB tables
echo "Creating/updating DynamoDB tables stack..."
aws cloudformation deploy \
    --template-file "$ROOT/infra/dynamodb-tables.yaml" \
    --stack-name "$STACK_TABLES" \
    --parameter-overrides "TablePrefix=$PREFIX" \
    --region "$REGION" \
    --no-fail-on-empty-changeset

echo "Tables stack deployed."

# Deploy IAM role and policy
echo "Creating/updating IAM stack..."
aws cloudformation deploy \
    --template-file "$ROOT/infra/iam-dynamodb-policy.yaml" \
    --stack-name "$STACK_IAM" \
    --parameter-overrides "TablePrefix=$PREFIX" \
    --region "$REGION" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset

echo "IAM stack deployed."

# Seed data (idempotent — skips tables that already have data)
echo ""
echo "Seeding DynamoDB tables..."
cd "$ROOT/backend"
DYNAMO_TABLE_PREFIX="$PREFIX" AWS_REGION="$REGION" .venv/bin/python -m scripts.seed_dynamo

echo ""
echo "Deployment complete."
echo "Backend role ARN:"
aws cloudformation describe-stacks \
    --stack-name "$STACK_IAM" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='BackendRoleArn'].OutputValue" \
    --output text

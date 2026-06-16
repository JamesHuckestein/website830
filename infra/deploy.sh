#!/bin/bash
set -euo pipefail

# Full deployment: DynamoDB + IAM + Cognito + Lambda + API Gateway + CloudFront
#
# Usage:
#   ./infra/deploy.sh              # deploys with default prefix (koc830-prod-)
#   ./infra/deploy.sh koc830-dev-  # deploys with dev prefix
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Python venv set up in backend/ with boto3 installed
#   - Node.js/npm for frontend build

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREFIX="${1:-koc830-prod-}"
REGION="${AWS_REGION:-us-east-1}"
CODE_BUCKET="koc830-assets"
CODE_KEY="lambda/backend-latest.zip"

echo "============================================="
echo "  KoC Council 830 — Full Deployment"
echo "  Prefix: $PREFIX"
echo "  Region: $REGION"
echo "============================================="
echo ""

# 1. DynamoDB Tables
echo "[1/9] Deploying DynamoDB tables..."
aws cloudformation deploy \
    --template-file "$ROOT/infra/dynamodb-tables.yaml" \
    --stack-name "${PREFIX}dynamodb-tables" \
    --parameter-overrides "TablePrefix=$PREFIX" \
    --region "$REGION" \
    --no-fail-on-empty-changeset
echo "  Done."

# 2. IAM Role (with Cognito permissions)
echo "[2/9] Deploying IAM role..."
aws cloudformation deploy \
    --template-file "$ROOT/infra/iam-dynamodb-policy.yaml" \
    --stack-name "${PREFIX}iam" \
    --parameter-overrides "TablePrefix=$PREFIX" \
    --region "$REGION" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset
BACKEND_ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name "${PREFIX}iam" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='BackendRoleArn'].OutputValue" --output text)
echo "  Role: $BACKEND_ROLE_ARN"

# 3. Cognito User Pool
echo "[3/9] Deploying Cognito User Pool..."
aws cloudformation deploy \
    --template-file "$ROOT/infra/cognito.yaml" \
    --stack-name "${PREFIX}cognito" \
    --parameter-overrides "TablePrefix=$PREFIX" \
    --region "$REGION" \
    --no-fail-on-empty-changeset
COGNITO_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "${PREFIX}cognito" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "${PREFIX}cognito" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
echo "  Pool ID: $COGNITO_POOL_ID"
echo "  Client ID: $COGNITO_CLIENT_ID"

# 4. Seed DynamoDB + Migrate Cognito users
echo "[4/9] Seeding DynamoDB tables..."
cd "$ROOT/backend"
DYNAMO_TABLE_PREFIX="$PREFIX" AWS_REGION="$REGION" .venv/bin/python -m scripts.seed_dynamo

echo "  Migrating users to Cognito..."
DYNAMO_TABLE_PREFIX="$PREFIX" AWS_REGION="$REGION" \
    COGNITO_USER_POOL_ID="$COGNITO_POOL_ID" \
    COGNITO_APP_CLIENT_ID="$COGNITO_CLIENT_ID" \
    .venv/bin/python -m scripts.migrate_cognito
cd "$ROOT"

# 5. Package backend Lambda
echo "[5/9] Packaging backend Lambda..."
"$ROOT/infra/package-backend.sh" "$CODE_BUCKET" "$CODE_KEY"

# 6. Deploy API Gateway + Lambda
echo "[6/9] Deploying API Gateway + Lambda..."
CORS_ORIGINS="*"  # Will update after CloudFront is deployed
aws cloudformation deploy \
    --template-file "$ROOT/infra/api-gateway-lambda.yaml" \
    --stack-name "${PREFIX}api" \
    --parameter-overrides \
        "TablePrefix=$PREFIX" \
        "BackendRoleArn=$BACKEND_ROLE_ARN" \
        "S3CodeBucket=$CODE_BUCKET" \
        "S3CodeKey=$CODE_KEY" \
        "CognitoUserPoolId=$COGNITO_POOL_ID" \
        "CognitoAppClientId=$COGNITO_CLIENT_ID" \
        "CorsOrigins=$CORS_ORIGINS" \
    --region "$REGION" \
    --no-fail-on-empty-changeset
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${PREFIX}api" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
echo "  API URL: $API_URL"

# 7. Deploy CloudFront (with API routing)
echo "[7/9] Deploying CloudFront distribution..."
aws cloudformation deploy \
    --template-file "$ROOT/infra/s3-frontend.yaml" \
    --stack-name "${PREFIX}frontend-cdn" \
    --parameter-overrides \
        "BucketName=koc830-frontend" \
        "ApiGatewayUrl=$API_URL" \
    --region "$REGION" \
    --no-fail-on-empty-changeset
CF_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "${PREFIX}frontend-cdn" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='DistributionDomain'].OutputValue" --output text)
CF_URL="https://$CF_DOMAIN"
echo "  CloudFront: $CF_URL"

# 8. Update Lambda CORS to CloudFront domain
echo "[8/9] Updating Lambda CORS origins..."
FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${PREFIX}api" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='FunctionName'].OutputValue" --output text)
aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment "Variables={DYNAMO_TABLE_PREFIX=$PREFIX,COGNITO_USER_POOL_ID=$COGNITO_POOL_ID,COGNITO_APP_CLIENT_ID=$COGNITO_CLIENT_ID,CORS_ORIGINS=$CF_URL,EMAIL_GATEWAY_URL=}" \
    --region "$REGION" \
    --output text --query "FunctionName"
echo "  CORS updated to $CF_URL"

# 9. Build and deploy frontend
echo "[9/9] Building and deploying frontend..."
cd "$ROOT/frontend"
NEXT_PUBLIC_API_URL="" npm run build
aws s3 sync "$ROOT/frontend/out/" "s3://koc830-frontend/" --delete --region "$REGION"
DIST_ID=$(aws cloudformation describe-stacks \
    --stack-name "${PREFIX}frontend-cdn" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --output text --query "Invalidation.Id"
echo "  Frontend deployed."

echo ""
echo "============================================="
echo "  Deployment Complete"
echo "============================================="
echo "  Frontend: $CF_URL"
echo "  API:      $API_URL"
echo "  Cognito:  $COGNITO_POOL_ID"
echo "============================================="

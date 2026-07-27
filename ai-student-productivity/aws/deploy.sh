#!/usr/bin/env bash
# ============================================================
# AWS Deployment Script – Build, Push, Deploy
# Usage: chmod +x aws/deploy.sh && ./aws/deploy.sh [staging|production]
# ============================================================
set -euo pipefail

ENVIRONMENT="${1:-staging}"
APP_NAME="ai-student-productivity"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${APP_NAME}"
IMAGE_TAG="${GITHUB_SHA:-$(git rev-parse --short HEAD)}"

echo "🚀 Deploying ${APP_NAME} to ${ENVIRONMENT}"
echo "   Region  : ${AWS_REGION}"
echo "   Account : ${AWS_ACCOUNT_ID}"
echo "   Tag     : ${IMAGE_TAG}"

# ── 1. Build Docker image ─────────────────────────────────────
echo "📦 Building Docker image..."
docker build -t "${APP_NAME}:${IMAGE_TAG}" .
docker tag "${APP_NAME}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker tag "${APP_NAME}:${IMAGE_TAG}" "${ECR_URI}:latest"

# ── 2. Push to ECR ────────────────────────────────────────────
echo "📤 Pushing to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_URI}"
docker push "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:latest"

# ── 3. Deploy CloudFormation stack ───────────────────────────
echo "☁️  Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file aws/cloudformation.yml \
  --stack-name "${APP_NAME}-${ENVIRONMENT}" \
  --parameter-overrides \
    AppName="${APP_NAME}" \
    Environment="${ENVIRONMENT}" \
    ImageTag="${IMAGE_TAG}" \
  --capabilities CAPABILITY_IAM \
  --region "${AWS_REGION}" \
  --no-fail-on-empty-changeset

# ── 4. Force ECS service update ──────────────────────────────
CLUSTER_NAME="${APP_NAME}-cluster"
SERVICE_NAME="${APP_NAME}-service"
echo "🔄 Forcing ECS service update..."
aws ecs update-service \
  --cluster "${CLUSTER_NAME}" \
  --service "${SERVICE_NAME}" \
  --force-new-deployment \
  --region "${AWS_REGION}" \
  --query 'service.serviceArn' \
  --output text

# ── 5. Wait for stable ───────────────────────────────────────
echo "⏳ Waiting for service stability..."
aws ecs wait services-stable \
  --cluster "${CLUSTER_NAME}" \
  --services "${SERVICE_NAME}" \
  --region "${AWS_REGION}"

echo "✅ Deployment complete!"

# ── 6. Show ALB URL ──────────────────────────────────────────
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name "${APP_NAME}-${ENVIRONMENT}" \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text --region "${AWS_REGION}" 2>/dev/null || echo "N/A")
echo "🌐 App URL: http://${ALB_DNS}"

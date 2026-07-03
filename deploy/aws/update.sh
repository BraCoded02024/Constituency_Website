#!/usr/bin/env bash
# Run on EC2 after git pull to redeploy.
# Usage: bash deploy/aws/update.sh
set -euo pipefail

git pull origin main

npm ci --prefix backend
npm ci --prefix frontend
npm run build --prefix frontend

pm2 reload deploy/aws/ecosystem.config.cjs --update-env

echo "Redeploy complete. Check: curl http://localhost/api/health"

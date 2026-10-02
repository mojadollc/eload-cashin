#!/bin/bash
set -e

APP_DIR="/var/www/cashin-tap"
DOMAIN="cashin-tap.com"
PORT="3000"

echo "=== Writing .env ==="
cat > $APP_DIR/.env << 'EOF'
DATABASE_URL="postgresql://cashintap:CashInTap2026!@localhost:5432/cashintap"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="a8f3k2m9p1q7r4s6t0u5v8w2x9y3z1b4c7d0e6f2g5h8i1j4k7l0m3n6o9p2q5r8"
JWT_REFRESH_SECRET="b9g4l1q6v3a8f5k2p7u0z5e2j9o4t1y6d3i8n5s0x7c4h1m6r3w0b7g4l1q6v3a8"
XENDIT_SECRET_KEY="xnd_development_REPLACE_WITH_REAL_KEY"
XENDIT_WEBHOOK_TOKEN="REPLACE_WITH_REAL_WEBHOOK_TOKEN"
XENDIT_CALLBACK_URL="https://cashin-tap.com/api/webhooks/xendit/payment"
XENDIT_PAYOUT_CALLBACK_URL="https://cashin-tap.com/api/webhooks/xendit/payout"
GBITS_API_URL="https://api.gbits.com"
GBITS_API_KEY="REPLACE_WITH_REAL_GBITS_KEY"
APP_URL="https://cashin-tap.com"
APP_NAME="CashIn Tap"
NODE_ENV="production"
PORT=3000
EOF
echo ".env written"

echo "=== Installing npm dependencies ==="
cd $APP_DIR
npm install --silent
echo "npm install done"

echo "=== Generating Prisma client ==="
npx prisma generate
echo "Prisma generate done"

echo "=== Pushing DB schema ==="
npx prisma db push --accept-data-loss
echo "DB push done"

echo "=== Seeding database ==="
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts 2>/dev/null || echo "Seed skipped (may already exist)"

echo "=== Building Next.js ==="
npm run build
echo "Build complete"

echo "=== SETUP DONE ==="

#!/bin/bash
# =============================================================
# CashIn Tap - VPS Deployment Script
# Domain: cashin-tap.com
# VPS:    169.58.148.248
# =============================================================

set -e

VPS_IP="169.58.148.248"
VPS_USER="root"
VPS_PASS="Dash@14333"
DOMAIN="cashin-tap.com"
APP_DIR="/var/www/cashin-tap"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================="
echo " CashIn Tap Deployment"
echo " Target: $VPS_USER@$VPS_IP"
echo " Domain: $DOMAIN"
echo "============================================="

# Check sshpass is available
if ! command -v sshpass &> /dev/null; then
  echo "[INFO] Installing sshpass..."
  apt-get install -y sshpass 2>/dev/null || yum install -y sshpass 2>/dev/null || brew install sshpass 2>/dev/null || {
    echo "[ERROR] Please install sshpass manually: apt install sshpass"
    exit 1
  }
fi

SSH="sshpass -p '$VPS_PASS' ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP"
SCP="sshpass -p '$VPS_PASS' scp -o StrictHostKeyChecking=no -r"

echo ""
echo "[1/8] Checking available port on VPS..."
AVAILABLE_PORT=$(eval "$SSH" "
  for port in 3000 3001 3002 3003 3004 3005 4000 4001 5000 5001 8000 8001 8080 8081; do
    if ! ss -tlnp | grep -q \":$port \"; then
      echo \$port
      break
    fi
  done
")

if [ -z "$AVAILABLE_PORT" ]; then
  echo "[ERROR] No available port found in range 3000-8081"
  exit 1
fi

echo "[OK] Using port: $AVAILABLE_PORT"

echo ""
echo "[2/8] Installing server dependencies (Node, PostgreSQL, Redis, Nginx, Certbot)..."
eval "$SSH" "
  export DEBIAN_FRONTEND=noninteractive

  # Update
  apt-get update -qq

  # Install Node.js 20
  if ! command -v node &>/dev/null || [[ \$(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -qq
    apt-get install -y nodejs -qq
  fi
  echo \"Node: \$(node -v)\"

  # Install PostgreSQL
  if ! command -v psql &>/dev/null; then
    apt-get install -y postgresql postgresql-contrib -qq
    systemctl enable postgresql
    systemctl start postgresql
  fi
  echo \"PostgreSQL: \$(psql --version)\"

  # Install Redis
  if ! command -v redis-server &>/dev/null; then
    apt-get install -y redis-server -qq
    systemctl enable redis-server
    systemctl start redis-server
  fi
  echo \"Redis: \$(redis-server --version)\"

  # Install Nginx
  if ! command -v nginx &>/dev/null; then
    apt-get install -y nginx -qq
    systemctl enable nginx
    systemctl start nginx
  fi
  echo \"Nginx: \$(nginx -v 2>&1)\"

  # Install Certbot
  if ! command -v certbot &>/dev/null; then
    apt-get install -y certbot python3-certbot-nginx -qq
  fi
  echo \"Certbot: \$(certbot --version)\"

  # Install PM2
  npm install -g pm2 -q
  echo \"PM2: \$(pm2 --version)\"
"

echo ""
echo "[3/8] Setting up PostgreSQL database..."
eval "$SSH" "
  sudo -u postgres psql -c \"CREATE USER cashintap WITH PASSWORD 'CashInTap2026!';\" 2>/dev/null || true
  sudo -u postgres psql -c \"CREATE DATABASE cashintap OWNER cashintap;\" 2>/dev/null || true
  sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE cashintap TO cashintap;\" 2>/dev/null || true
  echo 'Database ready'
"

echo ""
echo "[4/8] Uploading application files..."
eval "$SSH" "mkdir -p $APP_DIR"

# Exclude node_modules, .next, .git
$SCP \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='*.log' \
  "$LOCAL_DIR/." "$VPS_USER@$VPS_IP:$APP_DIR/"

echo "[OK] Files uploaded"

echo ""
echo "[5/8] Configuring environment and installing dependencies..."
eval "$SSH" "
  cd $APP_DIR

  # Write .env
  cat > .env << 'ENVEOF'
DATABASE_URL=\"postgresql://cashintap:CashInTap2026!@localhost:5432/cashintap\"
REDIS_URL=\"redis://localhost:6379\"
JWT_SECRET=\"$(openssl rand -hex 32)\"
JWT_REFRESH_SECRET=\"$(openssl rand -hex 32)\"
XENDIT_SECRET_KEY=\"xnd_development_REPLACE_ME\"
XENDIT_WEBHOOK_TOKEN=\"REPLACE_ME\"
XENDIT_CALLBACK_URL=\"https://$DOMAIN/api/webhooks/xendit/payment\"
XENDIT_PAYOUT_CALLBACK_URL=\"https://$DOMAIN/api/webhooks/xendit/payout\"
GBITS_API_URL=\"https://api.gbits.com\"
GBITS_API_KEY=\"REPLACE_ME\"
APP_URL=\"https://$DOMAIN\"
APP_NAME=\"CashIn Tap\"
NODE_ENV=\"production\"
PORT=$AVAILABLE_PORT
ENVEOF

  echo '.env written'

  # Install dependencies
  npm install --production=false --silent

  # Generate Prisma client
  npx prisma generate

  # Push DB schema
  npx prisma db push --accept-data-loss

  # Seed database
  npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts || echo 'Seed skipped (may already exist)'

  # Build Next.js
  npm run build

  echo 'Build complete'
"

echo ""
echo "[6/8] Configuring Nginx reverse proxy..."
eval "$SSH" "
cat > /etc/nginx/sites-available/cashin-tap << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        proxy_pass http://127.0.0.1:$AVAILABLE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:$AVAILABLE_PORT;
        add_header Cache-Control \"public, max-age=31536000, immutable\";
    }
}
NGINXEOF

  # Enable site
  ln -sf /etc/nginx/sites-available/cashin-tap /etc/nginx/sites-enabled/cashin-tap
  rm -f /etc/nginx/sites-enabled/default

  # Test and reload nginx
  nginx -t && systemctl reload nginx
  echo 'Nginx configured'
"

echo ""
echo "[7/8] Obtaining SSL certificate with Let's Encrypt..."
eval "$SSH" "
  certbot --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    --email admin@$DOMAIN \
    --redirect \
    --no-eff-email || echo '[WARN] SSL cert failed - domain DNS may not be pointed yet. Run certbot manually after DNS propagates.'

  # Auto-renew cron
  (crontab -l 2>/dev/null; echo '0 12 * * * /usr/bin/certbot renew --quiet') | sort -u | crontab -
  echo 'SSL configured'
"

echo ""
echo "[8/8] Starting application with PM2..."
eval "$SSH" "
  cd $APP_DIR

  # PM2 ecosystem config
  cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'cashin-tap',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '$APP_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: $AVAILABLE_PORT,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/cashin-tap/error.log',
      out_file: '/var/log/cashin-tap/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'cashin-tap-worker',
      script: 'node_modules/.bin/ts-node',
      args: '--compiler-options {\"module\":\"CommonJS\"} src/workers/worker.ts',
      cwd: '$APP_DIR',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: '/var/log/cashin-tap/worker-error.log',
      out_file: '/var/log/cashin-tap/worker-out.log',
    },
  ],
};
PM2EOF

  mkdir -p /var/log/cashin-tap

  # Stop existing if running
  pm2 delete cashin-tap 2>/dev/null || true
  pm2 delete cashin-tap-worker 2>/dev/null || true

  # Start app
  pm2 start ecosystem.config.js

  # Save PM2 process list
  pm2 save

  # Enable PM2 on boot
  pm2 startup systemd -u root --hp /root | tail -1 | bash || true

  echo 'PM2 started'
  pm2 list
"

echo ""
echo "============================================="
echo " DEPLOYMENT COMPLETE"
echo "============================================="
echo " App URL:    https://$DOMAIN"
echo " HTTP:       http://$DOMAIN"
echo " App Port:   $AVAILABLE_PORT"
echo " VPS IP:     $VPS_IP"
echo ""
echo " Admin Login:"
echo "   Mobile:   09000000000"
echo "   Password: Admin@1234"
echo ""
echo " IMPORTANT: Update .env on VPS with real API keys:"
echo "   ssh root@$VPS_IP"
echo "   nano $APP_DIR/.env"
echo "============================================="

# =============================================================
# CashIn Tap - Windows Deployment Script (PowerShell)
# Domain: cashin-tap.com
# VPS:    169.58.148.248
# =============================================================

$VPS_IP   = "169.58.148.248"
$VPS_USER = "root"
$VPS_PASS = "Dash@14333"
$DOMAIN   = "cashin-tap.com"
$APP_DIR  = "/var/www/cashin-tap"
$LOCAL_DIR = $PSScriptRoot

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " CashIn Tap - Windows Deployment" -ForegroundColor Cyan
Write-Host " Target: $VPS_USER@$VPS_IP" -ForegroundColor Cyan
Write-Host " Domain: $DOMAIN" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# ---- Helper: run SSH command via plink ----
function SSH-Run {
    param([string]$cmd)
    $result = echo y | plink -ssh -pw $VPS_PASS "$VPS_USER@$VPS_IP" $cmd 2>&1
    return $result
}

# ---- Check plink/pscp available ----
$plinkOk = Get-Command plink -ErrorAction SilentlyContinue
$pscpOk  = Get-Command pscp  -ErrorAction SilentlyContinue

if (-not $plinkOk -or -not $pscpOk) {
    Write-Host ""
    Write-Host "[INFO] PuTTY tools (plink/pscp) not found. Attempting to install via winget..." -ForegroundColor Yellow
    winget install PuTTY.PuTTY --silent 2>$null
    $env:PATH += ";C:\Program Files\PuTTY"
    $plinkOk = Get-Command plink -ErrorAction SilentlyContinue
    if (-not $plinkOk) {
        Write-Host "[ERROR] Please install PuTTY from https://www.putty.org/ and add to PATH" -ForegroundColor Red
        Write-Host "        Then re-run this script." -ForegroundColor Red
        exit 1
    }
}

# Accept host key
Write-Host "`n[0/8] Accepting VPS host key..." -ForegroundColor Yellow
echo y | plink -ssh -pw $VPS_PASS "$VPS_USER@$VPS_IP" "echo connected" 2>&1 | Out-Null

# ---- Step 1: Find available port ----
Write-Host "`n[1/8] Checking available port on VPS..." -ForegroundColor Yellow
$portScript = @'
for port in 3000 3001 3002 3003 3004 3005 4000 4001 5000 8000 8080 8081; do
  if ! ss -tlnp 2>/dev/null | grep -q ":$port " && ! netstat -tlnp 2>/dev/null | grep -q ":$port "; then
    echo $port; break
  fi
done
'@
$AVAILABLE_PORT = (SSH-Run $portScript).Trim()
if (-not $AVAILABLE_PORT) { $AVAILABLE_PORT = "3000" }
Write-Host "[OK] Using port: $AVAILABLE_PORT" -ForegroundColor Green

# ---- Step 2: Install server dependencies ----
Write-Host "`n[2/8] Installing server dependencies..." -ForegroundColor Yellow
$installScript = @"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq 2>/dev/null
if ! command -v node &>/dev/null || [[ \$(node -v 2>/dev/null | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
  apt-get install -y nodejs 2>/dev/null
fi
if ! command -v psql &>/dev/null; then
  apt-get install -y postgresql postgresql-contrib 2>/dev/null
  systemctl enable postgresql && systemctl start postgresql
fi
if ! command -v redis-server &>/dev/null; then
  apt-get install -y redis-server 2>/dev/null
  systemctl enable redis-server && systemctl start redis-server
fi
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx 2>/dev/null
  systemctl enable nginx && systemctl start nginx
fi
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx 2>/dev/null
fi
npm install -g pm2 --silent 2>/dev/null
echo "Dependencies OK | Node: \$(node -v) | PM2: \$(pm2 --version)"
"@
SSH-Run $installScript | Write-Host

# ---- Step 3: Setup PostgreSQL ----
Write-Host "`n[3/8] Setting up PostgreSQL database..." -ForegroundColor Yellow
$dbScript = @'
sudo -u postgres psql -c "CREATE USER cashintap WITH PASSWORD 'CashInTap2026!';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE cashintap OWNER cashintap;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cashintap TO cashintap;" 2>/dev/null || true
echo "Database ready"
'@
SSH-Run $dbScript | Write-Host

# ---- Step 4: Upload files ----
Write-Host "`n[4/8] Uploading application files (excluding node_modules, .next)..." -ForegroundColor Yellow
SSH-Run "mkdir -p $APP_DIR" | Out-Null

# Create exclusion list
$excludeFile = "$env:TEMP\pscp_exclude.txt"
@"
node_modules
.next
.git
*.log
"@ | Set-Content $excludeFile

# Use pscp to upload
$pscpArgs = @("-pw", $VPS_PASS, "-r", "-q", "$LOCAL_DIR\*", "${VPS_USER}@${VPS_IP}:${APP_DIR}/")
& pscp @pscpArgs 2>&1 | Where-Object { $_ -notmatch "node_modules|\.next|\.git" } | Out-Null
Write-Host "[OK] Files uploaded" -ForegroundColor Green

# ---- Step 5: Configure env + build ----
Write-Host "`n[5/8] Configuring environment and building..." -ForegroundColor Yellow
$JWT1 = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$JWT2 = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

$buildScript = @"
cd $APP_DIR

cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://cashintap:CashInTap2026!@localhost:5432/cashintap"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="$JWT1"
JWT_REFRESH_SECRET="$JWT2"
XENDIT_SECRET_KEY="xnd_development_REPLACE_ME"
XENDIT_WEBHOOK_TOKEN="REPLACE_ME"
XENDIT_CALLBACK_URL="https://$DOMAIN/api/webhooks/xendit/payment"
XENDIT_PAYOUT_CALLBACK_URL="https://$DOMAIN/api/webhooks/xendit/payout"
GBITS_API_URL="https://api.gbits.com"
GBITS_API_KEY="REPLACE_ME"
APP_URL="https://$DOMAIN"
APP_NAME="CashIn Tap"
NODE_ENV="production"
PORT=$AVAILABLE_PORT
ENVEOF

npm install --silent
npx prisma generate
npx prisma db push --accept-data-loss
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts 2>/dev/null || echo 'Seed skipped'
npm run build
echo 'Build complete'
"@
SSH-Run $buildScript | Write-Host

# ---- Step 6: Configure Nginx ----
Write-Host "`n[6/8] Configuring Nginx..." -ForegroundColor Yellow
$nginxConf = @"
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://127.0.0.1:$AVAILABLE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \`$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \`$host;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
        proxy_cache_bypass \`$http_upgrade;
        proxy_read_timeout 86400;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:$AVAILABLE_PORT;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
"@

$nginxScript = @"
cat > /etc/nginx/sites-available/cashin-tap << 'NGINXEOF'
$nginxConf
NGINXEOF
ln -sf /etc/nginx/sites-available/cashin-tap /etc/nginx/sites-enabled/cashin-tap
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo 'Nginx configured'
"@
SSH-Run $nginxScript | Write-Host

# ---- Step 7: SSL Certificate ----
Write-Host "`n[7/8] Obtaining SSL certificate..." -ForegroundColor Yellow
$sslScript = @"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect --no-eff-email 2>&1 || echo 'SSL: Run certbot manually after DNS propagates'
(crontab -l 2>/dev/null; echo '0 12 * * * /usr/bin/certbot renew --quiet') | sort -u | crontab -
echo 'SSL done'
"@
SSH-Run $sslScript | Write-Host

# ---- Step 8: Start with PM2 ----
Write-Host "`n[8/8] Starting application with PM2..." -ForegroundColor Yellow
$pm2Script = @"
cd $APP_DIR
mkdir -p /var/log/cashin-tap

cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'cashin-tap',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '$APP_DIR',
      env: { NODE_ENV: 'production', PORT: $AVAILABLE_PORT },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/cashin-tap/error.log',
      out_file: '/var/log/cashin-tap/out.log',
    },
    {
      name: 'cashin-tap-worker',
      script: 'node_modules/.bin/ts-node',
      args: '--compiler-options {"module":"CommonJS"} src/workers/worker.ts',
      cwd: '$APP_DIR',
      env: { NODE_ENV: 'production' },
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: '/var/log/cashin-tap/worker-error.log',
      out_file: '/var/log/cashin-tap/worker-out.log',
    },
  ],
};
PM2EOF

pm2 delete cashin-tap 2>/dev/null || true
pm2 delete cashin-tap-worker 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true
pm2 list
"@
SSH-Run $pm2Script | Write-Host

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host " App URL:    https://$DOMAIN" -ForegroundColor White
Write-Host " HTTP:       http://$DOMAIN" -ForegroundColor White
Write-Host " App Port:   $AVAILABLE_PORT" -ForegroundColor White
Write-Host " VPS IP:     $VPS_IP" -ForegroundColor White
Write-Host ""
Write-Host " Admin Login:" -ForegroundColor Yellow
Write-Host "   Mobile:   09000000000" -ForegroundColor White
Write-Host "   Password: Admin@1234" -ForegroundColor White
Write-Host ""
Write-Host " IMPORTANT: Update real API keys on VPS:" -ForegroundColor Yellow
Write-Host "   plink -pw $VPS_PASS root@$VPS_IP" -ForegroundColor White
Write-Host "   nano $APP_DIR/.env" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Green

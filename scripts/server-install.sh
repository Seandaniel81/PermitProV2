#!/bin/bash

# Permit Management System - Server Installation Script
# Supports Ubuntu/Debian servers

set -e

echo "🚀 Installing Permit Management System - Server Mode"
echo "=================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
apt install postgresql postgresql-contrib -y

# Install Nginx
echo "📦 Installing Nginx..."
apt install nginx -y

# Install PM2 for process management
echo "📦 Installing PM2..."
npm install -g pm2

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/permit-system
cd /var/www/permit-system

# Download application (replace with actual download URL)
echo "⬇️ Downloading application..."
# For now, assume the application is already cloned
# git clone https://github.com/yourdomain/permit-system.git .

# Install dependencies
echo "📦 Installing application dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build 2>/dev/null || {
    echo "Building with vite and esbuild..."
    npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
}

# Setup database
echo "🗃️ Setting up database..."
sudo -u postgres createdb permit_system 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER permit_user WITH PASSWORD 'secure_password_change_me';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE permit_system TO permit_user;" 2>/dev/null || echo "Privileges already granted"

# Create production environment file
echo "⚙️ Creating production environment..."
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://permit_user:secure_password_change_me@localhost:5432/permit_system

# Session configuration
SESSION_SECRET=$(openssl rand -base64 32)

# Authentication (set to false for production OAuth)
USE_DEV_AUTH=false

# OAuth configuration (fill in your values)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Application settings
AUTO_APPROVE_USERS=false
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,png

# Domain configuration
DOMAIN=yourdomain.com
SECURE_COOKIES=true
EOF

# Run database migrations
echo "🗃️ Running database migrations..."
npm run db:push 2>/dev/null || npx drizzle-kit push

# Create systemd service
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/permit-system.service << EOF
[Unit]
Description=Permit Management System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/permit-system
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data /var/www/permit-system
chmod -R 755 /var/www/permit-system

# Create Nginx configuration
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/permit-system << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/permit-system /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Enable and start services
echo "🚀 Starting services..."
systemctl enable permit-system
systemctl start permit-system
systemctl enable nginx
systemctl restart nginx

# Setup firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

# Install SSL certificate
echo "🔒 Installing SSL certificate..."
apt install certbot python3-certbot-nginx -y

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit /var/www/permit-system/.env with your configuration"
echo "2. Update server_name in /etc/nginx/sites-available/permit-system"
echo "3. Run: sudo certbot --nginx -d yourdomain.com"
echo "4. Check status: sudo systemctl status permit-system"
echo ""
echo "Access your application at: http://yourdomain.com"
echo "Logs: sudo journalctl -u permit-system -f"
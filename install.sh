#!/bin/bash

# Simple Installation Script for Permit Management System
# Works with current project structure

set -e

echo "Permit Management System - Quick Install"
echo "======================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "Node.js $(node -v) detected"

# Choose deployment type
echo ""
echo "1) Private computer (SQLite, localhost)"
echo "2) Server deployment (PostgreSQL, domain)"
read -p "Choose (1 or 2): " DEPLOY_TYPE

# Choose authentication
echo ""
echo "1) Local authentication (simple)"
echo "2) Auth0 (enterprise)"
read -p "Choose (1 or 2): " AUTH_TYPE

# Create directories
mkdir -p uploads backups dist

# Install dependencies
echo "Installing dependencies..."
npm install --silent

# Build application
echo "Building application..."
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Create configuration
echo "Creating configuration..."
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "dev-session-secret-$(date +%s)")

if [ "$DEPLOY_TYPE" = "2" ]; then
    read -p "Enter domain name: " DOMAIN
    DATABASE_URL="postgresql://permit_user:secure_pass@localhost:5432/permit_system"
    CALLBACK_URL="https://$DOMAIN/callback"
    LOGOUT_URL="https://$DOMAIN"
    SECURE="true"
else
    DATABASE_URL="file:./permit_system.db"
    CALLBACK_URL="http://localhost:3000/callback"
    LOGOUT_URL="http://localhost:3000"
    SECURE="false"
fi

cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=$DATABASE_URL
SESSION_SECRET=$SESSION_SECRET
SECURE_COOKIES=$SECURE
EOF

if [ "$AUTH_TYPE" = "2" ]; then
    echo ""
    read -p "Auth0 Domain: " AUTH0_DOMAIN
    read -p "Auth0 Client ID: " AUTH0_CLIENT_ID
    read -s -p "Auth0 Client Secret: " AUTH0_CLIENT_SECRET
    echo ""
    
    cat >> .env << EOF
USE_AUTH0=true
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
AUTH0_CALLBACK_URL=$CALLBACK_URL
AUTH0_LOGOUT_URL=$LOGOUT_URL
EOF
else
    cat >> .env << EOF
USE_AUTH0=false
USE_DEV_AUTH=true
EOF
fi

cat >> .env << EOF
AUTO_APPROVE_USERS=true
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,png
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups
EOF

# Setup database
echo "Setting up database..."
if [ "$DEPLOY_TYPE" = "2" ]; then
    if ! command -v psql &> /dev/null; then
        echo "Installing PostgreSQL..."
        sudo apt update && sudo apt install -y postgresql postgresql-contrib
        sudo systemctl enable postgresql
        sudo systemctl start postgresql
        
        sudo -u postgres createdb permit_system 2>/dev/null || true
        sudo -u postgres psql -c "CREATE USER permit_user WITH PASSWORD 'secure_pass';" 2>/dev/null || true
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE permit_system TO permit_user;" 2>/dev/null || true
    fi
fi

npx drizzle-kit push

# Create startup scripts
cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Permit Management System..."
echo "Access at: http://localhost:3000"
node dist/index.js
EOF
chmod +x start.sh

cat > start.bat << 'EOF'
@echo off
echo Starting Permit Management System...
echo Access at: http://localhost:3000
node dist/index.js
pause
EOF

# Server setup
if [ "$DEPLOY_TYPE" = "2" ]; then
    echo "Setting up server..."
    
    if ! command -v nginx &> /dev/null; then
        sudo apt install -y nginx
    fi
    
    sudo tee /etc/nginx/sites-available/permit-system > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/permit-system /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    sudo tee /etc/systemd/system/permit-system.service > /dev/null << EOF
[Unit]
Description=Permit Management System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl enable permit-system
    sudo systemctl start permit-system
    sudo systemctl reload nginx
    
    echo ""
    echo "Server setup complete!"
    echo "Access at: http://$DOMAIN"
    echo "Setup SSL: sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d $DOMAIN"
else
    echo ""
    echo "Private installation complete!"
    echo "Start with: ./start.sh"
    echo "Access at: http://localhost:3000"
fi

echo ""
echo "Installation finished!"
echo "Configuration: .env"
echo "Data directory: $(pwd)"
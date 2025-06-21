#!/bin/bash

# Quick Installation Script - Permit Management System
# Simplified version without complex bunfig.toml dependencies

set -e

echo "Permit Management System - Quick Install"
echo "======================================="

# Install Bun if needed
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    
    if ! command -v bun &> /dev/null; then
        echo "Bun installation failed. Using npm instead..."
        USE_NPM=true
    else
        echo "Bun $(bun --version) installed successfully"
        USE_NPM=false
    fi
else
    echo "Bun $(bun --version) detected"
    USE_NPM=false
fi

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

# Install dependencies (fallback to npm if bun fails)
echo "Installing dependencies..."
if [ "$USE_NPM" = "true" ]; then
    npm install
else
    # Temporarily rename bunfig.toml to avoid issues
    if [ -f "bunfig.toml" ]; then
        mv bunfig.toml bunfig.toml.bak
    fi
    
    bun install || {
        echo "Bun install failed, falling back to npm..."
        npm install
        USE_NPM=true
    }
    
    # Restore bunfig.toml if it existed
    if [ -f "bunfig.toml.bak" ]; then
        mv bunfig.toml.bak bunfig.toml
    fi
fi

# Build application
echo "Building application..."
if [ "$USE_NPM" = "true" ]; then
    npm run build
else
    bun run build
fi

# Create configuration
echo "Creating configuration..."
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "dev-session-secret-$(date +%s)")

if [ "$DEPLOY_TYPE" = "2" ]; then
    read -p "Enter domain name: " DOMAIN
    DATABASE_URL="postgresql://permit_user:secure_pass@localhost:5432/permit_system"
    CALLBACK_URL="https://$DOMAIN/callback"
    LOGOUT_URL="https://$DOMAIN"
    SECURE="true"
    PORT="3000"
else
    DATABASE_URL="file:./permit_system.db"
    CALLBACK_URL="http://localhost:3000/callback"
    LOGOUT_URL="http://localhost:3000"
    SECURE="false"
    PORT="3000"
fi

cat > .env << EOF
NODE_ENV=production
PORT=$PORT
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

if [ "$USE_NPM" = "true" ]; then
    npm run db:push
else
    bun run db:push
fi

# Create startup scripts
cat > start.sh << EOF
#!/bin/bash
echo "Starting Permit Management System..."
echo "Access at: http://localhost:$PORT"
if command -v bun &> /dev/null && [ "$USE_NPM" != "true" ]; then
    bun run dist/index.js
else
    node dist/index.js
fi
EOF
chmod +x start.sh

cat > start.bat << EOF
@echo off
echo Starting Permit Management System...
echo Access at: http://localhost:$PORT
if exist "%USERPROFILE%\.bun\bin\bun.exe" (
    "%USERPROFILE%\.bun\bin\bun.exe" run dist/index.js
) else (
    node dist/index.js
)
pause
EOF

# Server setup for production deployment
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
        proxy_pass http://localhost:$PORT;
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
ExecStart=$(which node) dist/index.js
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
    echo "Access at: http://localhost:$PORT"
fi

echo ""
echo "Installation finished!"
echo "Configuration: .env"
echo "Data directory: $(pwd)"
if [ "$USE_NPM" = "true" ]; then
    echo "Runtime: Node.js (npm fallback)"
else
    echo "Runtime: Bun $(bun --version)"
fi
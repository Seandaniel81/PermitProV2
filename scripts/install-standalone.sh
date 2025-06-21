#!/bin/bash

# Permit Management System - Standalone Installation Script
# Works for both private and server deployments

set -e

echo "🚀 Permit Management System - Installation"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Determine installation type
echo ""
echo "Select installation type:"
echo "1) Private Computer (localhost, SQLite)"
echo "2) Server Deployment (domain, PostgreSQL)" 
read -p "Enter choice (1 or 2): " INSTALL_TYPE

# Set up directories
mkdir -p uploads backups logs
echo "📁 Created data directories"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent

# Choose authentication
echo ""
echo "Authentication setup:"
echo "1) Local authentication (simple setup)"
echo "2) Auth0 (enterprise grade)"
read -p "Enter choice (1 or 2): " AUTH_CHOICE

# Create environment configuration
echo "⚙️ Creating configuration..."
if [ "$INSTALL_TYPE" = "2" ]; then
    # Server deployment
    read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN_NAME
    
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://permit_user:$(openssl rand -base64 16 | tr -d '=+/')@localhost:5432/permit_system
SESSION_SECRET=$(openssl rand -base64 32)
EOF

    if [ "$AUTH_CHOICE" = "2" ]; then
        echo ""
        echo "Enter Auth0 credentials:"
        read -p "Auth0 Domain: " AUTH0_DOMAIN
        read -p "Auth0 Client ID: " AUTH0_CLIENT_ID
        read -s -p "Auth0 Client Secret: " AUTH0_CLIENT_SECRET
        echo ""
        
        cat >> .env << EOF
USE_AUTH0=true
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
AUTH0_CALLBACK_URL=https://$DOMAIN_NAME/callback
AUTH0_LOGOUT_URL=https://$DOMAIN_NAME
EOF
    else
        cat >> .env << EOF
USE_AUTH0=false
USE_DEV_AUTH=true
EOF
    fi
    
    cat >> .env << EOF
AUTO_APPROVE_USERS=false
SECURE_COOKIES=true
TRUSTED_ORIGINS=https://$DOMAIN_NAME
EOF

else
    # Private installation
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=$(openssl rand -base64 32)
EOF

    if [ "$AUTH_CHOICE" = "2" ]; then
        echo ""
        echo "Enter Auth0 credentials:"
        read -p "Auth0 Domain: " AUTH0_DOMAIN
        read -p "Auth0 Client ID: " AUTH0_CLIENT_ID
        read -s -p "Auth0 Client Secret: " AUTH0_CLIENT_SECRET
        echo ""
        
        cat >> .env << EOF
USE_AUTH0=true
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
AUTH0_CALLBACK_URL=http://localhost:3000/callback
AUTH0_LOGOUT_URL=http://localhost:3000
EOF
    else
        cat >> .env << EOF
USE_AUTH0=false
USE_DEV_AUTH=true
EOF
    fi
    
    cat >> .env << EOF
AUTO_APPROVE_USERS=true
SECURE_COOKIES=false
TRUSTED_ORIGINS=http://localhost:3000
EOF
fi

# Add common settings
cat >> .env << EOF

# Application Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,png
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups
EOF

echo "✅ Configuration created"

# Build application
echo "🔨 Building application..."
echo "Building client..."
npx vite build --silent
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --silent

echo "✅ Application built"

# Setup database
echo "🗃️ Setting up database..."
if [ "$INSTALL_TYPE" = "2" ]; then
    # Install PostgreSQL if needed
    if ! command -v psql &> /dev/null; then
        echo "Installing PostgreSQL..."
        if command -v apt-get &> /dev/null; then
            sudo apt update && sudo apt install -y postgresql postgresql-contrib
        elif command -v yum &> /dev/null; then
            sudo yum install -y postgresql postgresql-server
            sudo postgresql-setup initdb
        fi
        
        sudo systemctl enable postgresql
        sudo systemctl start postgresql
        
        # Create database and user
        sudo -u postgres createdb permit_system 2>/dev/null || echo "Database exists"
        sudo -u postgres psql -c "CREATE USER permit_user WITH PASSWORD 'secure_password';" 2>/dev/null || echo "User exists"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE permit_system TO permit_user;"
    fi
fi

# Run database migrations
npx drizzle-kit push --config=./drizzle.config.ts
echo "✅ Database setup complete"

# Create startup scripts
echo "📝 Creating startup scripts..."

cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Permit Management System..."
echo "📍 Access at: http://localhost:3000"
echo "⏹️  Press Ctrl+C to stop"
node dist/index.js
EOF
chmod +x start.sh

cat > start.bat << 'EOF'
@echo off
echo 🚀 Starting Permit Management System...
echo 📍 Access at: http://localhost:3000
echo ⏹️  Press Ctrl+C to stop
node dist/index.js
pause
EOF

# Server-specific setup
if [ "$INSTALL_TYPE" = "2" ]; then
    echo "🌐 Setting up server deployment..."
    
    # Create systemd service
    sudo tee /etc/systemd/system/permit-system.service > /dev/null << EOF
[Unit]
Description=Permit Management System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    # Install and configure Nginx
    if ! command -v nginx &> /dev/null; then
        sudo apt install -y nginx
    fi
    
    sudo tee /etc/nginx/sites-available/permit-system > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

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
}
EOF

    sudo ln -sf /etc/nginx/sites-available/permit-system /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Set permissions
    sudo chown -R www-data:www-data $(pwd)
    
    # Enable and start services
    sudo systemctl enable permit-system
    sudo systemctl start permit-system
    sudo systemctl reload nginx
    
    # Setup SSL
    if command -v certbot &> /dev/null; then
        echo "Setting up SSL certificate..."
        sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    else
        echo "📝 To setup SSL, install certbot and run:"
        echo "sudo apt install certbot python3-certbot-nginx"
        echo "sudo certbot --nginx -d $DOMAIN_NAME"
    fi
fi

# Create desktop shortcut for private installation
if [ "$INSTALL_TYPE" = "1" ] && [ -d "$HOME/Desktop" ]; then
    cat > "$HOME/Desktop/Permit System.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Permit Management System
Comment=Building Permit Package Management
Exec=$(pwd)/start.sh
Terminal=true
Categories=Office;
EOF
    chmod +x "$HOME/Desktop/Permit System.desktop"
    echo "🖥️ Desktop shortcut created"
fi

echo ""
echo "✅ Installation Complete!"
echo "========================"

if [ "$INSTALL_TYPE" = "2" ]; then
    echo "🌐 Server deployment ready:"
    echo "   URL: https://$DOMAIN_NAME"
    echo "   Status: sudo systemctl status permit-system"
    echo "   Logs: sudo journalctl -u permit-system -f"
else
    echo "🏠 Private installation ready:"
    echo "   Start: ./start.sh"
    echo "   URL: http://localhost:3000"
fi

echo ""
echo "📁 Data stored in: $(pwd)"
echo "⚙️  Configuration: .env"

if [ "$AUTH_CHOICE" = "2" ]; then
    echo "🔐 Auth0 configured - ensure your application settings match:"
    if [ "$INSTALL_TYPE" = "2" ]; then
        echo "   Callback URL: https://$DOMAIN_NAME/callback"
    else
        echo "   Callback URL: http://localhost:3000/callback"
    fi
fi

echo ""
echo "🎯 Ready to use!"
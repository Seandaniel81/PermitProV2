#!/bin/bash

# Universal Deployment Script for Permit Management System
# Supports both online server and private computer deployments with Auth0

set -e

echo "🚀 Permit Management System - Universal Deployment"
echo "================================================="

# Function to detect deployment type
detect_deployment_type() {
    echo "Please select deployment type:"
    echo "1) Online Server (VPS/Cloud with domain)"
    echo "2) Private Computer (Local network)"
    read -p "Enter choice (1 or 2): " DEPLOY_TYPE
    
    case $DEPLOY_TYPE in
        1)
            echo "✅ Online Server deployment selected"
            DEPLOYMENT_MODE="server"
            ;;
        2)
            echo "✅ Private Computer deployment selected"
            DEPLOYMENT_MODE="private"
            ;;
        *)
            echo "❌ Invalid choice. Defaulting to Private Computer"
            DEPLOYMENT_MODE="private"
            ;;
    esac
}

# Function to choose authentication method
choose_auth_method() {
    echo ""
    echo "Select authentication method:"
    echo "1) Auth0 (Enterprise SSO, recommended for production)"
    echo "2) Local Authentication (Simple, for development/testing)"
    read -p "Enter choice (1 or 2): " AUTH_TYPE
    
    case $AUTH_TYPE in
        1)
            echo "✅ Auth0 authentication selected"
            USE_AUTH0="true"
            setup_auth0_config
            ;;
        2)
            echo "✅ Local authentication selected"
            USE_AUTH0="false"
            ;;
        *)
            echo "❌ Invalid choice. Defaulting to Local Authentication"
            USE_AUTH0="false"
            ;;
    esac
}

# Function to setup Auth0 configuration
setup_auth0_config() {
    echo ""
    echo "🔐 Auth0 Configuration Setup"
    echo "Please provide your Auth0 application details:"
    
    read -p "Auth0 Domain (e.g., your-tenant.auth0.com): " AUTH0_DOMAIN
    read -p "Auth0 Client ID: " AUTH0_CLIENT_ID
    read -s -p "Auth0 Client Secret: " AUTH0_CLIENT_SECRET
    echo ""
    
    if [ "$DEPLOYMENT_MODE" = "server" ]; then
        read -p "Your domain (e.g., yourdomain.com): " DOMAIN_NAME
        AUTH0_CALLBACK_URL="https://$DOMAIN_NAME/callback"
        AUTH0_LOGOUT_URL="https://$DOMAIN_NAME"
    else
        AUTH0_CALLBACK_URL="http://localhost:3000/callback"
        AUTH0_LOGOUT_URL="http://localhost:3000"
    fi
    
    echo "✅ Auth0 configuration collected"
}

# Function to create environment file
create_env_file() {
    echo "⚙️ Creating environment configuration..."
    
    # Generate secure session secret
    SESSION_SECRET=$(openssl rand -base64 32)
    
    cat > .env << EOF
# Permit Management System Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
EOF

    if [ "$DEPLOYMENT_MODE" = "server" ]; then
        cat >> .env << EOF
DATABASE_URL=postgresql://permit_user:$(openssl rand -base64 16)@localhost:5432/permit_system
EOF
    else
        echo "Choose database type for private installation:"
        echo "1) SQLite (Recommended - no setup required)"
        echo "2) PostgreSQL (Advanced users)"
        read -p "Enter choice (1 or 2): " DB_TYPE
        
        if [ "$DB_TYPE" = "2" ]; then
            cat >> .env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/permit_system
EOF
        else
            cat >> .env << EOF
DATABASE_URL=file:./permit_system.db
EOF
        fi
    fi

    cat >> .env << EOF

# Session Configuration
SESSION_SECRET=$SESSION_SECRET

# Authentication Configuration
USE_AUTH0=$USE_AUTH0
EOF

    if [ "$USE_AUTH0" = "true" ]; then
        cat >> .env << EOF

# Auth0 Configuration
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
AUTH0_CALLBACK_URL=$AUTH0_CALLBACK_URL
AUTH0_LOGOUT_URL=$AUTH0_LOGOUT_URL
EOF
    else
        cat >> .env << EOF

# Local Development Authentication
USE_DEV_AUTH=true
EOF
    fi

    cat >> .env << EOF

# Application Settings
AUTO_APPROVE_USERS=$([ "$DEPLOYMENT_MODE" = "private" ] && echo "true" || echo "false")
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,png

# File Storage
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups

# Security Settings
SECURE_COOKIES=$([ "$DEPLOYMENT_MODE" = "server" ] && echo "true" || echo "false")
EOF

    if [ "$DEPLOYMENT_MODE" = "server" ]; then
        cat >> .env << EOF
TRUSTED_ORIGINS=https://$DOMAIN_NAME
EOF
    else
        cat >> .env << EOF
TRUSTED_ORIGINS=http://localhost:3000
EOF
    fi

    echo "✅ Environment configuration created"
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing system dependencies..."
    
    if [ "$DEPLOYMENT_MODE" = "server" ]; then
        # Server installation
        if command -v apt-get &> /dev/null; then
            sudo apt update
            sudo apt install -y nodejs npm postgresql postgresql-contrib nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y nodejs npm postgresql postgresql-server nginx
        fi
    else
        # Private installation
        if ! command -v node &> /dev/null; then
            echo "Node.js not found. Please install Node.js 16+ from https://nodejs.org"
            exit 1
        fi
    fi
    
    echo "📦 Installing application dependencies..."
    npm install --production
}

# Function to setup database
setup_database() {
    echo "🗃️ Setting up database..."
    
    if [ "$DEPLOYMENT_MODE" = "server" ]; then
        # Setup PostgreSQL for server
        sudo -u postgres createdb permit_system 2>/dev/null || echo "Database exists"
        sudo -u postgres createuser permit_user 2>/dev/null || echo "User exists"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE permit_system TO permit_user;"
    fi
    
    # Run database migrations
    npm run db:push
    echo "✅ Database setup complete"
}

# Function to build application
build_application() {
    echo "🔨 Building application..."
    npm run build
    echo "✅ Application built successfully"
}

# Function to setup server deployment
setup_server_deployment() {
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

    # Setup Nginx
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
    
    # Enable services
    sudo systemctl enable permit-system
    sudo systemctl start permit-system
    sudo systemctl enable nginx
    sudo systemctl restart nginx
    
    # Setup SSL
    if command -v certbot &> /dev/null; then
        sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    else
        echo "📝 SSL Setup: Install certbot and run: sudo certbot --nginx -d $DOMAIN_NAME"
    fi
    
    echo "✅ Server deployment complete"
}

# Function to setup private deployment
setup_private_deployment() {
    echo "🏠 Setting up private deployment..."
    
    # Create startup scripts
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

    # Create desktop shortcut (Linux)
    if [ "$(uname)" = "Linux" ] && [ -d "$HOME/Desktop" ]; then
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
    fi
    
    echo "✅ Private deployment complete"
}

# Function to display completion message
show_completion_message() {
    echo ""
    echo "🎉 Deployment Complete!"
    echo "====================="
    
    if [ "$DEPLOYMENT_MODE" = "server" ]; then
        echo "🌐 Your application is available at:"
        if [ "$USE_AUTH0" = "true" ]; then
            echo "   https://$DOMAIN_NAME"
        else
            echo "   http://$DOMAIN_NAME (setup SSL for production)"
        fi
        echo ""
        echo "📊 Server management:"
        echo "   Status: sudo systemctl status permit-system"
        echo "   Logs: sudo journalctl -u permit-system -f"
        echo "   Restart: sudo systemctl restart permit-system"
    else
        echo "🏠 Your application is ready to start:"
        echo "   ./start.sh (Linux/Mac)"
        echo "   start.bat (Windows)"
        echo ""
        echo "📍 Access at: http://localhost:3000"
    fi
    
    echo ""
    echo "📁 Installation directory: $(pwd)"
    echo "⚙️  Configuration file: .env"
    
    if [ "$USE_AUTH0" = "true" ]; then
        echo ""
        echo "🔐 Auth0 Setup Checklist:"
        echo "   ✓ Application configured"
        echo "   ✓ Callback URLs set"
        echo "   📖 See AUTH0_SETUP.md for user management"
    fi
    
    echo ""
    echo "📖 Documentation:"
    echo "   - PRODUCTION_DEPLOYMENT.md"
    echo "   - AUTH0_SETUP.md"
    echo "   - README.md"
}

# Main deployment flow
main() {
    detect_deployment_type
    choose_auth_method
    create_env_file
    install_dependencies
    setup_database
    build_application
    
    if [ "$DEPLOYMENT_MODE" = "server" ]; then
        setup_server_deployment
    else
        setup_private_deployment
    fi
    
    show_completion_message
}

# Run main function
main "$@"
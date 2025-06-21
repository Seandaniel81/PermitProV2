#!/bin/bash

# Bun-Based Deployment Script for Permit Management System
# Supports both server and private deployments with Auth0 integration

set -e

echo "Permit Management System - Bun Deployment"
echo "========================================="

# Function to install Bun
install_bun() {
    if ! command -v bun &> /dev/null; then
        echo "Installing Bun runtime..."
        curl -fsSL https://bun.sh/install | bash
        export PATH="$HOME/.bun/bin:$PATH"
        
        # Add to shell profile
        if [ -f "$HOME/.bashrc" ]; then
            echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$HOME/.bashrc"
        fi
        if [ -f "$HOME/.zshrc" ]; then
            echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$HOME/.zshrc"
        fi
        
        if ! command -v bun &> /dev/null; then
            echo "Bun installation failed. Install manually from https://bun.sh"
            exit 1
        fi
    fi
    echo "Bun $(bun --version) ready"
}

# Function to choose deployment type
choose_deployment() {
    echo ""
    echo "Select deployment type:"
    echo "1) Private Computer (SQLite, localhost)"
    echo "2) Server Deployment (PostgreSQL, domain)"
    read -p "Choose (1 or 2): " DEPLOY_TYPE
    
    echo ""
    echo "Select authentication:"
    echo "1) Local authentication (simple)"
    echo "2) Auth0 (enterprise grade)"
    read -p "Choose (1 or 2): " AUTH_TYPE
}

# Function to setup environment
setup_environment() {
    echo "Creating environment configuration..."
    
    # Generate secure session secret
    SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    
    if [ "$DEPLOY_TYPE" = "2" ]; then
        # Server deployment
        read -p "Enter your domain name: " DOMAIN_NAME
        DATABASE_URL="postgresql://permit_user:$(openssl rand -base64 16 | tr -d '=+/')@localhost:5432/permit_system"
        CALLBACK_URL="https://$DOMAIN_NAME/callback"
        LOGOUT_URL="https://$DOMAIN_NAME"
        SECURE_COOKIES="true"
        AUTO_APPROVE="false"
        TRUSTED_ORIGINS="https://$DOMAIN_NAME"
    else
        # Private deployment
        DATABASE_URL="file:./permit_system.db"
        CALLBACK_URL="http://localhost:3000/callback"
        LOGOUT_URL="http://localhost:3000"
        SECURE_COOKIES="false"
        AUTO_APPROVE="true"
        TRUSTED_ORIGINS="http://localhost:3000"
    fi
    
    # Create base environment
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=$DATABASE_URL
SESSION_SECRET=$SESSION_SECRET
SECURE_COOKIES=$SECURE_COOKIES
AUTO_APPROVE_USERS=$AUTO_APPROVE
TRUSTED_ORIGINS=$TRUSTED_ORIGINS

# Application Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,png
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups
EOF

    # Add authentication configuration
    if [ "$AUTH_TYPE" = "2" ]; then
        echo ""
        echo "Enter Auth0 configuration:"
        read -p "Auth0 Domain: " AUTH0_DOMAIN
        read -p "Auth0 Client ID: " AUTH0_CLIENT_ID
        read -s -p "Auth0 Client Secret: " AUTH0_CLIENT_SECRET
        echo ""
        
        cat >> .env << EOF

# Auth0 Configuration
USE_AUTH0=true
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
AUTH0_CALLBACK_URL=$CALLBACK_URL
AUTH0_LOGOUT_URL=$LOGOUT_URL
EOF
    else
        cat >> .env << EOF

# Local Authentication
USE_AUTH0=false
USE_DEV_AUTH=true
EOF
    fi
}

# Function to setup directories and dependencies
setup_application() {
    echo "Setting up application..."
    
    # Create required directories
    mkdir -p uploads backups logs dist
    
    # Install dependencies with Bun
    echo "Installing dependencies with Bun..."
    bun install
    
    # Build application
    echo "Building application..."
    bun run build
}

# Function to setup database
setup_database() {
    echo "Setting up database..."
    
    if [ "$DEPLOY_TYPE" = "2" ]; then
        # Server PostgreSQL setup
        if ! command -v psql &> /dev/null; then
            echo "Installing PostgreSQL..."
            if command -v apt-get &> /dev/null; then
                sudo apt update
                sudo apt install -y postgresql postgresql-contrib
            elif command -v yum &> /dev/null; then
                sudo yum install -y postgresql postgresql-server
                sudo postgresql-setup initdb
            fi
            
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
        fi
        
        # Create database and user
        DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
        sudo -u postgres createdb permit_system 2>/dev/null || true
        sudo -u postgres psql -c "CREATE USER permit_user WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE permit_system TO permit_user;" 2>/dev/null || true
    fi
    
    # Run database migrations
    bun run db:push
}

# Function to create startup scripts
create_startup_scripts() {
    echo "Creating startup scripts..."
    
    # Bun startup script for Unix
    cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Permit Management System with Bun..."
echo "Access at: http://localhost:3000"
bun run dist/index.js
EOF
    chmod +x start.sh
    
    # Windows batch file
    cat > start.bat << 'EOF'
@echo off
echo Starting Permit Management System with Bun...
echo Access at: http://localhost:3000
bun run dist/index.js
pause
EOF
    
    # Development script
    cat > dev.sh << 'EOF'
#!/bin/bash
echo "Starting development server with Bun..."
bun run dev
EOF
    chmod +x dev.sh
}

# Function to setup server deployment
setup_server_deployment() {
    if [ "$DEPLOY_TYPE" != "2" ]; then
        return
    fi
    
    echo "Configuring server deployment..."
    
    # Install Nginx if not present
    if ! command -v nginx &> /dev/null; then
        sudo apt install -y nginx
    fi
    
    # Create Nginx configuration
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
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/permit-system /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Create systemd service
    sudo tee /etc/systemd/system/permit-system.service > /dev/null << EOF
[Unit]
Description=Permit Management System (Bun)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$HOME/.bun/bin/bun run dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PATH=$HOME/.bun/bin:\$PATH

[Install]
WantedBy=multi-user.target
EOF

    # Set permissions
    sudo chown -R $USER:$USER $(pwd)
    
    # Enable and start services
    sudo systemctl enable permit-system
    sudo systemctl start permit-system
    sudo systemctl reload nginx
    
    # Setup SSL certificate
    if command -v certbot &> /dev/null; then
        echo "Setting up SSL certificate..."
        sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME 2>/dev/null || {
            echo "SSL setup failed. Run manually: sudo certbot --nginx -d $DOMAIN_NAME"
        }
    else
        echo "Install certbot for SSL: sudo apt install certbot python3-certbot-nginx"
        echo "Then run: sudo certbot --nginx -d $DOMAIN_NAME"
    fi
}

# Function to create desktop shortcuts
create_desktop_integration() {
    if [ "$DEPLOY_TYPE" = "2" ]; then
        return
    fi
    
    # Create desktop shortcut on Linux
    if [ "$(uname)" = "Linux" ] && [ -d "$HOME/Desktop" ]; then
        cat > "$HOME/Desktop/Permit System.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Permit Management System
Comment=Building Permit Package Management
Exec=$(pwd)/start.sh
Terminal=true
Categories=Office;Development;
EOF
        chmod +x "$HOME/Desktop/Permit System.desktop"
        echo "Desktop shortcut created"
    fi
}

# Function to display completion summary
show_completion_summary() {
    echo ""
    echo "Deployment Complete!"
    echo "==================="
    
    if [ "$DEPLOY_TYPE" = "2" ]; then
        echo "Server deployment ready:"
        echo "  URL: https://$DOMAIN_NAME"
        echo "  Service: sudo systemctl status permit-system"
        echo "  Logs: sudo journalctl -u permit-system -f"
        echo "  Restart: sudo systemctl restart permit-system"
    else
        echo "Private installation ready:"
        echo "  Start: ./start.sh"
        echo "  Development: ./dev.sh"
        echo "  URL: http://localhost:3000"
    fi
    
    echo ""
    echo "Configuration:"
    echo "  Environment: .env"
    echo "  Data directory: $(pwd)"
    echo "  Runtime: Bun $(bun --version)"
    
    if [ "$AUTH_TYPE" = "2" ]; then
        echo ""
        echo "Auth0 Configuration:"
        echo "  Domain: $AUTH0_DOMAIN"
        echo "  Callback URL: $CALLBACK_URL"
        echo "  Logout URL: $LOGOUT_URL"
        echo "  Setup guide: AUTH0_SETUP.md"
    fi
    
    echo ""
    echo "System ready for use!"
}

# Main deployment flow
main() {
    install_bun
    choose_deployment
    setup_environment
    setup_application
    setup_database
    create_startup_scripts
    setup_server_deployment
    create_desktop_integration
    show_completion_summary
}

# Execute main function
main "$@"
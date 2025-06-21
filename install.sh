#!/bin/bash

# Simple Installation Script for Permit Management System
# Works with current project structure

set -e

echo "Permit Management System - Quick Install"
echo "======================================="

# Check Bun
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    
    if ! command -v bun &> /dev/null; then
        echo "Error: Bun installation failed. Please install manually from https://bun.sh"
        exit 1
    fi
fi

echo "Bun $(bun --version) detected"

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
bun install

# Build application
echo "Building application..."
bun run build

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
    bun run db:push
else
    # For SQLite, use the custom setup script
    echo "Creating SQLite database..."
    node setup-sqlite.js
fi

# Install and configure Apache2
echo "Installing and configuring Apache2..."
if ! command -v apache2 &> /dev/null; then
    echo "Installing Apache2..."
    sudo apt update && sudo apt install -y apache2
fi

# Enable necessary Apache modules
echo "Enabling Apache modules..."
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_balancer
sudo a2enmod lbmethod_byrequests
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers

# Configure Apache virtual host based on deployment type
if [ "$DEPLOY_TYPE" = "2" ]; then
    # Production Apache virtual host
    echo "Creating production Apache virtual host..."
    sudo tee /etc/apache2/sites-available/permit-system.conf > /dev/null << 'APACHE_EOF'
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html
    
    # Proxy all requests to Node.js application
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3001/api/
    ProxyPassReverse /api/ http://localhost:3001/api/
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    # Enable compression
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \\.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \\.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/permit-system-error.log
    CustomLog ${APACHE_LOG_DIR}/permit-system-access.log combined
</VirtualHost>

# SSL Virtual Host (if SSL certificate is available)
<IfModule mod_ssl.c>
    <VirtualHost *:443>
        ServerName localhost
        DocumentRoot /var/www/html
        
        SSLEngine on
        # SSLCertificateFile /path/to/certificate.crt
        # SSLCertificateKeyFile /path/to/private.key
        
        # Proxy all requests to Node.js application
        ProxyPreserveHost On
        ProxyPass /api/ http://localhost:3001/api/
        ProxyPassReverse /api/ http://localhost:3001/api/
        ProxyPass / http://localhost:3001/
        ProxyPassReverse / http://localhost:3001/
        
        # Security headers
        Header always set X-Content-Type-Options nosniff
        Header always set X-Frame-Options DENY
        Header always set X-XSS-Protection "1; mode=block"
        Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
        
        # Logs
        ErrorLog ${APACHE_LOG_DIR}/permit-system-ssl-error.log
        CustomLog ${APACHE_LOG_DIR}/permit-system-ssl-access.log combined
    </VirtualHost>
</IfModule>
APACHE_EOF

    # Enable the production site
    sudo a2ensite permit-system.conf
    
else
    # Development Apache virtual host
    echo "Creating development Apache virtual host..."
    sudo tee /etc/apache2/sites-available/permit-system-dev.conf > /dev/null << 'APACHE_EOF'
<VirtualHost *:80>
    ServerName localhost
    ServerAlias 127.0.0.1
    DocumentRoot /var/www/html
    
    # Proxy all requests to Node.js development server
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:5000/api/
    ProxyPassReverse /api/ http://localhost:5000/api/
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    # Enable hot reload for development (WebSocket support)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:5000/$1" [P,L]
    
    # Development headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/permit-system-dev-error.log
    CustomLog ${APACHE_LOG_DIR}/permit-system-dev-access.log combined
</VirtualHost>
APACHE_EOF

    # Enable the development site
    sudo a2ensite permit-system-dev.conf
fi

# Disable default Apache site
sudo a2dissite 000-default.conf 2>/dev/null || true

# Test Apache configuration
echo "Testing Apache configuration..."
sudo apache2ctl configtest

# Restart Apache
echo "Restarting Apache..."
sudo systemctl restart apache2
sudo systemctl enable apache2

echo "Apache2 configured successfully!"
if [ "$DEPLOY_TYPE" = "2" ]; then
    echo "Production site available at: http://localhost"
    echo "SSL site will be available at: https://localhost (after SSL certificate setup)"
else
    echo "Development site available at: http://localhost"
fi

# Create startup scripts
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "Starting Permit Management System (Development)"
echo "=============================================="
echo "Development server with hot reload"
echo "Access via Apache at: http://localhost"
echo "Direct access at: http://localhost:5000"
npm run dev
EOF
chmod +x start-dev.sh

# Update existing production startup script
cat > start-prod.sh << 'EOF'
#!/bin/bash
echo "Starting Permit Management System (Production)"
echo "============================================="

# Set production environment
export NODE_ENV=production
export PORT=3001

# Load production environment if it exists
if [ -f ".env.production" ]; then
    set -a
    source .env.production
    set +a
fi

# Create required directories
mkdir -p uploads backups logs

# Build if necessary
if [ ! -f "dist/index.js" ]; then
    echo "Building application..."
    npm run build
fi

echo "Starting production server on port $PORT..."
echo "Access via Apache at: http://localhost"
echo "Direct access at: http://localhost:$PORT"
node dist/index.js
EOF
chmod +x start-prod.sh

echo ""
echo "=========================================="
echo "PERMIT MANAGEMENT SYSTEM SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Apache2 has been configured and is running"
echo ""
if [ "$DEPLOY_TYPE" = "2" ]; then
    echo "PRODUCTION DEPLOYMENT:"
    echo "• Apache virtual host: permit-system.conf"
    echo "• Main access: http://localhost (via Apache)"
    echo "• Direct access: http://localhost:3001"
    echo "• Database: PostgreSQL"
    echo "• Start server: ./start-prod.sh"
    echo "• SSL ready (configure certificates in Apache)"
    echo ""
    echo "To setup SSL certificate:"
    echo "sudo apt install certbot python3-certbot-apache"
    echo "sudo certbot --apache"
else
    echo "DEVELOPMENT/PRIVATE DEPLOYMENT:"
    echo "• Apache virtual host: permit-system-dev.conf"
    echo "• Main access: http://localhost (via Apache)"
    echo "• Direct access: http://localhost:5000"
    echo "• Database: SQLite (permit_system.db)"
    echo "• Start development: ./start-dev.sh"
    echo "• Start production: ./start-prod.sh"
fi
echo ""
echo "Default admin login: admin@localhost / admin123"
echo ""
echo "Available startup scripts:"
echo "• ./start-dev.sh  - Development mode with hot reload"
echo "• ./start-prod.sh - Production mode"
echo ""
echo "Apache management:"
echo "• Status: sudo systemctl status apache2"
echo "• Restart: sudo systemctl restart apache2"
echo "• Logs: sudo tail -f /var/log/apache2/permit-system*-error.log"
echo ""
echo "Installation finished!"
echo "Configuration: .env"
echo "Data directory: $(pwd)"
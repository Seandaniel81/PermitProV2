#!/bin/bash

# Quick Setup Script for Permit Management System
# Provides working SQLite authentication for Kali Linux

set -e

echo "Setting up Permit Management System with SQLite Authentication..."

# Generate secure session secret
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -d "=+/" | cut -c1-32)

# Create .env configuration
cat > .env << EOF
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=${SESSION_SECRET}
FORCE_LOCAL_AUTH=true
USE_DEV_AUTH=true
NODE_ENV=development
PORT=5000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF

echo "Environment configuration created"

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run database setup using the standalone script
echo "Setting up database with admin user..."
node setup-database-standalone.js

# Configure Apache2
echo "Configuring Apache2..."

# Install Apache2 if not present
if ! command -v apache2 &> /dev/null; then
    echo "Installing Apache2..."
    sudo apt-get update
    sudo apt-get install -y apache2
fi

# Enable required modules
sudo a2enmod proxy proxy_http ssl rewrite

# Create virtual host configuration
sudo tee /etc/apache2/sites-available/permit-system.conf > /dev/null << 'APACHE_EOF'
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html

    # Proxy all requests to Node.js application
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/

    # Enable logging
    ErrorLog ${APACHE_LOG_DIR}/permit_error.log
    CustomLog ${APACHE_LOG_DIR}/permit_access.log combined

    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
APACHE_EOF

# Enable the site
sudo a2ensite permit-system.conf

# Disable default Apache site to avoid conflicts
sudo a2dissite 000-default.conf 2>/dev/null || true

# Test Apache configuration
if sudo apache2ctl configtest; then
    echo "Apache configuration is valid"
    sudo systemctl reload apache2
    echo "Apache2 configured and reloaded"
else
    echo "Apache configuration error - please check manually"
fi

echo ""
echo "Setup completed successfully!"
echo ""
echo "Admin Login Credentials:"
echo "  Email: admin@localhost"
echo "  Password: admin123"
echo ""
echo "To start the system:"
echo "  1. Start the Node.js application: npm run dev"
echo "  2. Apache will proxy requests from port 80 to port 5000"
echo ""
echo "Access the system at:"
echo "  http://localhost/api/login"
echo ""
echo "Apache serves the application on port 80, proxying to Node.js on port 5000"
echo "Check Apache logs: sudo tail -f /var/log/apache2/permit_error.log"
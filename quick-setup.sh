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

# Create SQLite database and admin user
cat > temp-db-setup.js << 'EOF'
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

async function setup() {
    console.log('Creating SQLite database...');
    const db = new Database('./permit_system.db');
    
    // Create users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            profile_image_url TEXT,
            role TEXT DEFAULT 'user',
            is_active INTEGER DEFAULT 1,
            approval_status TEXT DEFAULT 'approved',
            approved_by TEXT,
            approved_at INTEGER,
            rejection_reason TEXT,
            company TEXT,
            phone TEXT,
            last_login_at INTEGER,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch())
        );
    `);
    
    // Create sessions table for authentication
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expire INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const now = Math.floor(Date.now() / 1000);
    
    const insertUser = db.prepare(`
        INSERT OR REPLACE INTO users (
            id, email, password_hash, first_name, last_name, 
            role, is_active, approval_status, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run(
        'admin',
        'admin@localhost', 
        hashedPassword,
        'Admin',
        'User',
        'admin',
        1,
        'approved',
        now,
        now,
        now
    );
    
    console.log('Database setup completed');
    console.log('Admin user: admin@localhost / admin123');
    
    db.close();
}

setup().catch(console.error);
EOF

# Run database setup
node temp-db-setup.js
rm temp-db-setup.js

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
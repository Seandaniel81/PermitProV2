#!/bin/bash

# Permit Management System - Complete Setup Script
# Supports both Local SQLite and OIDC Authentication

set -e

echo "🔧 Permit Management System Setup"
echo "================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Function to generate secure random string
generate_secret() {
    openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -d "=+/" | cut -c1-32
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing system dependencies..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y nodejs npm sqlite3 apache2 git curl build-essential
    elif command -v yum &> /dev/null; then
        sudo yum install -y nodejs npm sqlite git httpd curl gcc-c++
    elif command -v brew &> /dev/null; then
        brew install node sqlite apache2
    else
        echo "❌ Unsupported package manager. Please install Node.js, npm, and sqlite3 manually."
        exit 1
    fi
    
    echo "✅ System dependencies installed"
}

# Function to setup project
setup_project() {
    echo "🛠️ Setting up project..."
    
    # Install Node.js dependencies
    if [ -f "package.json" ]; then
        if command -v bun &> /dev/null; then
            echo "Using Bun package manager..."
            bun install
        else
            echo "Using npm package manager..."
            npm install
        fi
    else
        echo "❌ package.json not found. Make sure you're in the project directory."
        exit 1
    fi
    
    # Create upload directory
    mkdir -p uploads
    chmod 755 uploads
    
    echo "✅ Project setup completed"
}

# Function to configure Local SQLite Authentication
setup_sqlite_auth() {
    echo "🔐 Configuring Local SQLite Authentication..."
    
    # Generate session secret
    SESSION_SECRET=$(generate_secret)
    
    # Create .env file for SQLite mode
    cat > .env << EOF
# Database Configuration
DATABASE_URL=file:./permit_system.db

# Authentication Configuration
SESSION_SECRET=${SESSION_SECRET}
FORCE_LOCAL_AUTH=true
USE_DEV_AUTH=true

# Application Settings
NODE_ENV=development
PORT=5000

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Security Settings
AUTO_APPROVE_USERS=true
EOF

    echo "✅ Environment configuration created"
    
    # Create SQLite database with admin user
    echo "🗄️ Setting up SQLite database..."
    
    # Create the database setup script
    cat > setup-admin.js << 'EOF'
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

async function setupDatabase() {
    const dbPath = path.join(process.cwd(), 'permit_system.db');
    const db = new Database(dbPath);
    
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
    
    // Create sessions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expire INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
    // Check if admin user exists
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@localhost');
    
    if (!existingAdmin) {
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const now = Math.floor(Date.now() / 1000);
        
        // Insert admin user
        db.prepare(`
            INSERT INTO users (
                id, email, password_hash, first_name, last_name, 
                role, is_active, approval_status, approved_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
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
        
        console.log('✅ Admin user created successfully');
        console.log('   Email: admin@localhost');
        console.log('   Password: admin123');
    } else {
        console.log('✅ Admin user already exists');
    }
    
    db.close();
    console.log('✅ Database setup completed');
}

setupDatabase().catch(console.error);
EOF

    # Run the database setup
    node setup-admin.js
    rm setup-admin.js
    
    echo "✅ SQLite authentication configured"
    echo ""
    echo "🔑 Default Admin Credentials:"
    echo "   Email: admin@localhost"
    echo "   Password: admin123"
    echo ""
}

# Function to configure OIDC Authentication
setup_oidc_auth() {
    echo "🔐 Configuring OIDC Authentication..."
    
    # Get user input for OIDC configuration
    read -p "Choose OIDC provider (1=Auth0, 2=Google): " provider_choice
    
    if [ "$provider_choice" = "1" ]; then
        read -p "Enter Auth0 Domain (e.g., your-domain.auth0.com): " auth0_domain
        read -p "Enter Auth0 Client ID: " client_id
        read -s -p "Enter Auth0 Client Secret: " client_secret
        echo
        issuer_url="https://${auth0_domain}"
    elif [ "$provider_choice" = "2" ]; then
        read -p "Enter Google Client ID: " client_id
        read -s -p "Enter Google Client Secret: " client_secret
        echo
        issuer_url="https://accounts.google.com"
    else
        echo "❌ Invalid choice. Please select 1 or 2."
        exit 1
    fi
    
    read -p "Enter allowed domains (comma-separated, e.g., yourdomain.com,localhost:3001): " allowed_domains
    read -p "Enter PostgreSQL Database URL: " database_url
    
    # Generate session secret
    SESSION_SECRET=$(generate_secret)
    
    # Create .env file for OIDC mode
    cat > .env << EOF
# Database Configuration
DATABASE_URL=${database_url}

# Authentication - OIDC Configuration
SESSION_SECRET=${SESSION_SECRET}
OIDC_ISSUER_URL=${issuer_url}
OIDC_CLIENT_ID=${client_id}
OIDC_CLIENT_SECRET=${client_secret}
ALLOWED_DOMAINS=${allowed_domains}
AUTO_APPROVE_USERS=false
FORCE_LOCAL_AUTH=false
USE_DEV_AUTH=false

# Application Settings
NODE_ENV=production
PORT=3001

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF

    echo "✅ OIDC authentication configured"
}

# Function to setup Apache2
setup_apache() {
    local mode=$1
    
    if ! command -v apache2 &> /dev/null && ! command -v httpd &> /dev/null; then
        echo "⚠️ Apache2 not found. Skipping Apache configuration."
        return
    fi
    
    echo "🌐 Setting up Apache2 configuration..."
    
    # Enable required modules
    if command -v a2enmod &> /dev/null; then
        sudo a2enmod proxy proxy_http ssl rewrite
    fi
    
    if [ "$mode" = "sqlite" ]; then
        # Development configuration (port 5000)
        sudo tee /etc/apache2/sites-available/permit-dev.conf > /dev/null << EOF
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html

    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/

    ErrorLog \${APACHE_LOG_DIR}/permit-dev_error.log
    CustomLog \${APACHE_LOG_DIR}/permit-dev_access.log combined
</VirtualHost>
EOF
        
        if command -v a2ensite &> /dev/null; then
            sudo a2ensite permit-dev
        fi
        
        echo "✅ Apache2 configured for development (localhost:80 -> localhost:5000)"
    else
        # Production configuration (port 3001)
        read -p "Enter your domain name (e.g., permits.yourdomain.com): " domain_name
        
        sudo tee /etc/apache2/sites-available/permit-prod.conf > /dev/null << EOF
<VirtualHost *:80>
    ServerName ${domain_name}
    DocumentRoot /var/www/html

    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/

    ErrorLog \${APACHE_LOG_DIR}/permit-prod_error.log
    CustomLog \${APACHE_LOG_DIR}/permit-prod_access.log combined
</VirtualHost>
EOF
        
        if command -v a2ensite &> /dev/null; then
            sudo a2ensite permit-prod
        fi
        
        echo "✅ Apache2 configured for production (${domain_name}:80 -> localhost:3001)"
    fi
    
    # Reload Apache
    if command -v systemctl &> /dev/null; then
        sudo systemctl reload apache2 2>/dev/null || sudo systemctl reload httpd 2>/dev/null || true
    fi
}

# Function to start the application
start_application() {
    local mode=$1
    
    echo "🚀 Starting the application..."
    
    if [ "$mode" = "sqlite" ]; then
        echo "Starting in development mode (SQLite)..."
        if command -v bun &> /dev/null; then
            echo "To start: bun run dev"
        else
            echo "To start: npm run dev"
        fi
        echo "Access at: http://localhost:5000"
    else
        echo "Starting in production mode (OIDC)..."
        if command -v bun &> /dev/null; then
            echo "To build: bun run build"
            echo "To start: bun start"
        else
            echo "To build: npm run build"
            echo "To start: npm start"
        fi
        echo "Access at: http://localhost:3001"
    fi
}

# Function to show final instructions
show_final_instructions() {
    local mode=$1
    
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    
    if [ "$mode" = "sqlite" ]; then
        echo "✅ Local SQLite Authentication configured"
        echo "🔑 Admin Login: admin@localhost / admin123"
        echo "🌐 Access: http://localhost:5000/api/login"
        echo ""
        echo "To start the application:"
        echo "  npm run dev  (or bun run dev)"
        echo ""
        echo "To access the admin dashboard:"
        echo "  1. Go to http://localhost:5000/api/login"
        echo "  2. Login with admin@localhost / admin123"
        echo "  3. You'll be redirected to the dashboard"
    else
        echo "✅ OIDC Authentication configured"
        echo "🌐 Access: http://localhost:3001/api/login"
        echo ""
        echo "To start the application:"
        echo "  npm run build && npm start  (or bun run build && bun start)"
        echo ""
        echo "Users will authenticate through your OIDC provider"
    fi
    
    echo ""
    echo "📁 Important files:"
    echo "  .env              - Environment configuration"
    echo "  permit_system.db  - SQLite database (if using SQLite)"
    echo "  uploads/          - File upload directory"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  - Check logs in console output"
    echo "  - Verify .env configuration"
    echo "  - Ensure all dependencies are installed"
    echo "  - Check Apache logs: /var/log/apache2/"
}

# Main execution
main() {
    echo "Select authentication mode:"
    echo "1) Local SQLite Authentication (recommended for private/development)"
    echo "2) OIDC Authentication (recommended for production)"
    read -p "Enter choice (1 or 2): " auth_choice
    
    case $auth_choice in
        1)
            AUTH_MODE="sqlite"
            ;;
        2)
            AUTH_MODE="oidc"
            ;;
        *)
            echo "❌ Invalid choice. Please select 1 or 2."
            exit 1
            ;;
    esac
    
    # Install dependencies
    read -p "Install system dependencies? (y/n): " install_deps
    if [[ $install_deps =~ ^[Yy]$ ]]; then
        install_dependencies
    fi
    
    # Setup project
    setup_project
    
    # Configure authentication
    if [ "$AUTH_MODE" = "sqlite" ]; then
        setup_sqlite_auth
    else
        setup_oidc_auth
    fi
    
    # Setup Apache
    read -p "Configure Apache2? (y/n): " setup_apache_choice
    if [[ $setup_apache_choice =~ ^[Yy]$ ]]; then
        setup_apache "$AUTH_MODE"
    fi
    
    # Show instructions
    start_application "$AUTH_MODE"
    show_final_instructions "$AUTH_MODE"
}

# Run main function
main "$@"
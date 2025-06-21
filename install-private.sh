#!/bin/bash

# Simple Private Installation Script for Permit Management System
# Run from the project root directory

set -e

echo "Installing Permit Management System - Private Mode"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Bun is installed
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

# Install dependencies
echo "Installing dependencies..."
bun install

# Database setup
echo "Database Setup:"
echo "1) SQLite (Recommended for private use)"
echo "2) PostgreSQL (Advanced users)"
read -p "Choose database option (1 or 2): " DB_CHOICE

if [ "$DB_CHOICE" = "1" ]; then
    DATABASE_URL="file:./permit_system.db"
    echo "SQLite will be used"
elif [ "$DB_CHOICE" = "2" ]; then
    # Install PostgreSQL if needed
    if ! command -v psql &> /dev/null; then
        echo "Installing PostgreSQL..."
        if command -v apt-get &> /dev/null; then
            sudo apt update && sudo apt install -y postgresql postgresql-contrib
        elif command -v brew &> /dev/null; then
            brew install postgresql
            brew services start postgresql
        else
            echo "Please install PostgreSQL manually"
            exit 1
        fi
    fi
    DATABASE_URL="postgresql://postgres:password@localhost:5432/permit_system"
    echo "PostgreSQL will be used"
else
    echo "Invalid choice, using SQLite"
    DATABASE_URL="file:./permit_system.db"
fi

# Authentication setup
echo "Authentication Setup:"
echo "1) Simple local login (No external dependencies)"
echo "2) Auth0 (Enterprise authentication)"
read -p "Choose authentication mode (1 or 2): " AUTH_CHOICE

if [ "$AUTH_CHOICE" = "2" ]; then
    USE_AUTH0="true"
    echo "Auth0 selected - you'll need to configure credentials"
    echo "Enter Auth0 Domain (e.g., your-tenant.auth0.com):"
    read AUTH0_DOMAIN
    echo "Enter Auth0 Client ID:"
    read AUTH0_CLIENT_ID
    echo "Enter Auth0 Client Secret:"
    read -s AUTH0_CLIENT_SECRET
    echo ""
else
    USE_AUTH0="false"
    echo "Local authentication selected"
fi

# Create environment file
echo "Creating configuration..."
cat > .env << EOF
# Private Installation Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=$DATABASE_URL

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "dev-secret-$(date +%s)")

# Authentication Configuration
USE_AUTH0=$USE_AUTH0
EOF

if [ "$USE_AUTH0" = "true" ]; then
cat >> .env << EOF

# Auth0 Configuration
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
AUTH0_CALLBACK_URL=http://localhost:3000/callback
AUTH0_LOGOUT_URL=http://localhost:3000
EOF
else
cat >> .env << EOF

# Local Development Authentication
USE_DEV_AUTH=true
EOF
fi

cat >> .env << EOF

# Application Settings
AUTO_APPROVE_USERS=true
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,png
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups
SECURE_COOKIES=false
TRUSTED_ORIGINS=http://localhost:3000
EOF

# Create directories
mkdir -p uploads backups

# Build application
echo "Building application..."
bun run build

# Setup database
echo "Setting up database..."
if [ "$DB_CHOICE" = "2" ]; then
    # Create PostgreSQL database if needed
    sudo -u postgres createdb permit_system 2>/dev/null || true
fi
bun run db:push

# Create startup scripts
echo "Creating startup scripts..."

cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Permit Management System..."
echo "Access at: http://localhost:3000"
echo "Press Ctrl+C to stop"
bun run dist/index.js
EOF
chmod +x start.sh

cat > start.bat << 'EOF'
@echo off
echo Starting Permit Management System...
echo Access at: http://localhost:3000
echo Press Ctrl+C to stop
bun run dist/index.js
pause
EOF

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

echo ""
echo "Installation Complete!"
echo "===================="
echo "Start the system: ./start.sh"
echo "Access at: http://localhost:3000"
echo "Configuration: .env"
echo "Data location: $(pwd)"

if [ "$USE_AUTH0" = "true" ]; then
    echo ""
    echo "Auth0 Setup Required:"
    echo "1. Login to your Auth0 dashboard"
    echo "2. Add callback URL: http://localhost:3000/callback"
    echo "3. Add logout URL: http://localhost:3000"
    echo "4. Enable required scopes: openid, profile, email"
fi

echo ""
echo "Ready to use!"
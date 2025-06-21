#!/bin/bash

# Permit Management System - Private Computer Installation Script
# Supports Linux, macOS, and Windows (via WSL)

set -e

echo "🏠 Installing Permit Management System - Private Mode"
echo "===================================================="

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=Mac;;
    CYGWIN*)    OS_TYPE=Cygwin;;
    MINGW*)     OS_TYPE=MinGw;;
    *)          OS_TYPE="UNKNOWN:${OS}"
esac

echo "📋 Detected OS: $OS_TYPE"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    if [ "$OS_TYPE" = "Linux" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS_TYPE" = "Mac" ]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            echo "❌ Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    fi
fi

# Create application directory
INSTALL_DIR="$HOME/permit-system"
echo "📁 Creating application directory at $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download application (replace with actual download URL)
echo "⬇️ Downloading application..."
# For demo, we'll assume files are copied here
# In production, this would download from a release URL

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Choose database option
echo "🗃️ Database Setup"
echo "1) SQLite (Recommended for private use)"
echo "2) PostgreSQL (Advanced users)"
read -p "Choose database option (1 or 2): " DB_CHOICE

if [ "$DB_CHOICE" = "1" ]; then
    echo "📦 Installing SQLite..."
    npm install sqlite3
    DATABASE_URL="file:./permit_system.db"
    echo "✅ SQLite will be used"
elif [ "$DB_CHOICE" = "2" ]; then
    echo "📦 Setting up PostgreSQL..."
    if [ "$OS_TYPE" = "Linux" ]; then
        sudo apt install postgresql postgresql-contrib -y
    elif [ "$OS_TYPE" = "Mac" ]; then
        brew install postgresql
        brew services start postgresql
    fi
    DATABASE_URL="postgresql://postgres:password@localhost:5432/permit_system"
    echo "✅ PostgreSQL installed"
else
    echo "❌ Invalid choice, defaulting to SQLite"
    DATABASE_URL="file:./permit_system.db"
fi

# Choose authentication mode
echo "🔐 Authentication Setup"
echo "1) Simple local login (No external dependencies)"
echo "2) Auth0 (Enterprise authentication)"
read -p "Choose authentication mode (1 or 2): " AUTH_CHOICE

if [ "$AUTH_CHOICE" = "1" ]; then
    USE_AUTH0="false"
    echo "✅ Local authentication selected"
elif [ "$AUTH_CHOICE" = "2" ]; then
    USE_AUTH0="true"
    echo "✅ Auth0 selected"
    echo "📝 You'll need to configure Auth0 credentials in .env"
else
    echo "❌ Invalid choice, defaulting to local authentication"
    USE_AUTH0="false"
fi

# Create environment file
echo "⚙️ Creating configuration file..."
cat > .env << EOF
# Private Installation Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=$DATABASE_URL

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 32)

# Authentication Configuration
USE_AUTH0=$USE_AUTH0

EOF

if [ "$USE_AUTH0" = "true" ]; then
cat >> .env << EOF
# Auth0 Configuration (fill in your values)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
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

# File Storage
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups

# Security (relaxed for private use)
SECURE_COOKIES=false
TRUSTED_ORIGINS=http://localhost:3000
EOF

# Create uploads and backup directories
mkdir -p uploads backups

# Build application
echo "🔨 Building application..."
npm run build 2>/dev/null || {
    echo "Building with vite and esbuild..."
    npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
}

# Run database setup
echo "🗃️ Setting up database..."
npm run db:push 2>/dev/null || npx drizzle-kit push

# Create startup scripts
echo "📝 Creating startup scripts..."

# Linux/Mac startup script
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Permit Management System..."
echo "📍 Access at: http://localhost:3000"
echo "⏹️  Press Ctrl+C to stop"
node dist/index.js
EOF
chmod +x start.sh

# Windows batch file
cat > start.bat << 'EOF'
@echo off
echo 🚀 Starting Permit Management System...
echo 📍 Access at: http://localhost:3000
echo ⏹️  Press Ctrl+C to stop
node dist/index.js
pause
EOF

# Create desktop shortcut (Linux)
if [ "$OS_TYPE" = "Linux" ] && [ -d "$HOME/Desktop" ]; then
    cat > "$HOME/Desktop/Permit System.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Permit Management System
Comment=Building Permit Package Management
Exec=$INSTALL_DIR/start.sh
Icon=$INSTALL_DIR/icon.png
Terminal=true
Categories=Office;
EOF
    chmod +x "$HOME/Desktop/Permit System.desktop"
    echo "🖥️ Desktop shortcut created"
fi

# Create system service (optional)
if [ "$OS_TYPE" = "Linux" ]; then
    echo "🔧 Would you like to install as a system service? (y/n)"
    read -p "This will start the system automatically on boot: " INSTALL_SERVICE
    
    if [ "$INSTALL_SERVICE" = "y" ] || [ "$INSTALL_SERVICE" = "Y" ]; then
        sudo tee /etc/systemd/system/permit-system.service > /dev/null << EOF
[Unit]
Description=Permit Management System (Private)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

        sudo systemctl enable permit-system
        sudo systemctl start permit-system
        echo "✅ System service installed and started"
    fi
fi

echo ""
echo "✅ Installation Complete!"
echo ""
echo "🚀 To start the application:"
echo "   ./start.sh"
echo ""
echo "📍 Access your application at:"
echo "   http://localhost:3000"
echo ""
echo "📁 Installation directory:"
echo "   $INSTALL_DIR"
echo ""
echo "📝 Configuration file:"
echo "   $INSTALL_DIR/.env"
echo ""

if [ "$USE_AUTH0" = "true" ]; then
    echo "🔐 Auth0 Setup Required:"
    echo "   1. Create Auth0 application at https://auth0.com"
    echo "   2. Set callback URL: http://localhost:3000/callback"
    echo "   3. Update .env with your Auth0 credentials"
    echo ""
fi

echo "💾 Data is stored in:"
echo "   Database: $DATABASE_URL"
echo "   Uploads: $INSTALL_DIR/uploads"
echo "   Backups: $INSTALL_DIR/backups"
echo ""
echo "📖 Documentation: README.md"
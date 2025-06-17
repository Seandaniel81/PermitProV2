#!/bin/bash

# Permit Management System Installation Script

set -e

echo "🏗️  Installing Permit Management System for Independent Hosting"
echo "=============================================================="

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc || source ~/.zshrc || true
    
    if ! command -v bun &> /dev/null; then
        echo "❌ Bun installation failed. Please install manually from https://bun.sh"
        exit 1
    fi
fi

echo "✅ Bun found: $(bun --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads logs backups

# Copy environment template if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating environment configuration..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✏️  Please edit .env file with your database credentials before continuing."
        echo "   Example: DATABASE_URL=postgresql://username:password@localhost:5432/permits_db"
        read -p "Press Enter when you've configured .env file..."
    else
        echo "❌ .env.example file not found. Creating basic .env template..."
        # Generate a secure session secret
        SESSION_SECRET=$(openssl rand -hex 32)
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/permits_db

# Authentication - OpenID Connect Configuration (Google OAuth)
SESSION_SECRET=$SESSION_SECRET
OIDC_ISSUER_URL=https://accounts.google.com
OIDC_CLIENT_ID=625523063326-hnq3mak1r35pfv739fa7ppcekthqas0a.apps.googleusercontent.com
OIDC_CLIENT_SECRET=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
ALLOWED_DOMAINS=localhost,swonger.tplinkdns.com
AUTO_APPROVE_USERS=true

# Application Settings
NODE_ENV=production
PORT=5000

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF
        echo "✏️  Please edit .env file with your actual configuration before continuing."
        read -p "Press Enter when you've configured .env file..."
    fi
fi

# Validate DATABASE_URL is set
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://username:password@localhost:5432/permits_db" ]; then
    echo "❌ Please configure DATABASE_URL in .env file with your actual database credentials."
    echo "   Example: DATABASE_URL=\"postgresql://postgres:204874@localhost:5432/permits_db\""
    echo "   Current DATABASE_URL: ${DATABASE_URL:-'not set'}"
    exit 1
fi

echo "✅ DATABASE_URL configured: ${DATABASE_URL}"

# Build the application
echo "🔨 Building application..."
bun run build

# Setup database
echo "🗄️  Setting up database..."
if [ -f scripts/setup-database.ts ]; then
    bun run scripts/setup-database.ts
else
    echo "⚠️  Database setup script not found. Please run 'bun run db:push' manually after installation."
fi

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review and customize settings in the application"
echo "2. Configure SSL certificates for production"
echo "3. Set up reverse proxy (nginx/Apache)"
echo "4. Start the application: bun start"
echo ""
echo "For production deployment with PM2:"
echo "  bun install -g pm2"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save && pm2 startup"
#!/bin/bash

# Permit Management System Installation Script

set -e

echo "🏗️  Installing Permit Management System for Independent Hosting"
echo "=============================================================="

# Check if Node.js is installed and version is adequate
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

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

# Authentication - OpenID Connect Configuration
SESSION_SECRET=$SESSION_SECRET
OIDC_ISSUER_URL=https://accounts.google.com
OIDC_CLIENT_ID=your-client-id-from-oauth-provider
OIDC_CLIENT_SECRET=your-client-secret-from-oauth-provider
ALLOWED_DOMAINS=localhost
AUTO_APPROVE_USERS=false

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
source .env
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://username:password@localhost:5432/permits_db" ]; then
    echo "❌ Please configure DATABASE_URL in .env file with your actual database credentials."
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Setup database
echo "🗄️  Setting up database..."
if [ -f scripts/setup-database.ts ]; then
    npx tsx scripts/setup-database.ts
else
    echo "⚠️  Database setup script not found. Please run 'npm run db:push' manually after installation."
fi

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review and customize settings in the application"
echo "2. Configure SSL certificates for production"
echo "3. Set up reverse proxy (nginx/Apache)"
echo "4. Start the application: npm start"
echo ""
echo "For production deployment with PM2:"
echo "  npm install -g pm2"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save && pm2 startup"
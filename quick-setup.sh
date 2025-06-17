#!/bin/bash

# Quick Setup Script for Permit Management System
set -e

echo "🚀 Quick Setup for Permit Management System"
echo "============================================"

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

# Get database URL from user
read -p "Enter your PostgreSQL connection string: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is required"
    exit 1
fi

echo "📦 Installing dependencies..."
bun install

echo "📁 Creating directories..."
mkdir -p uploads logs backups

echo "⚙️ Creating configuration..."
SESSION_SECRET=$(openssl rand -hex 32)
cat > .env << EOF
# Database Configuration
DATABASE_URL=$DATABASE_URL

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

echo "🔨 Building application..."
bun run build

echo "🗄️ Setting up database..."
if [ -f scripts/setup-database.ts ]; then
    bun run scripts/setup-database.ts
else
    echo "⚠️ Database setup script not found. Running db:push..."
    bun run db:push
fi

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🎉 Your permit management system is ready!"
echo ""
echo "To start the application:"
echo "  bun start"
echo ""
echo "For development mode:"
echo "  bun run dev"
echo ""
echo "The application will be available at: http://localhost:5000"
echo ""
echo "📋 Next steps:"
echo "1. Configure OAuth provider (see OIDC_SETUP.md)"
echo "2. Update ALLOWED_DOMAINS in .env file for production"
echo "3. Set up SSL certificates for production deployment"
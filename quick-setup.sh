#!/bin/bash

# Quick Setup Script for Permit Management System
set -e

echo "🚀 Quick Setup for Permit Management System"
echo "============================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Get database URL from user
read -p "Enter your PostgreSQL connection string: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is required"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

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
npm run build

echo "🗄️ Setting up database..."
if [ -f scripts/setup-database.ts ]; then
    npx tsx scripts/setup-database.ts
else
    echo "⚠️ Database setup script not found. Running db:push..."
    npm run db:push
fi

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🎉 Your permit management system is ready!"
echo ""
echo "To start the application:"
echo "  npm start"
echo ""
echo "For development mode:"
echo "  npm run dev"
echo ""
echo "The application will be available at: http://localhost:5000"
echo ""
echo "📋 Next steps:"
echo "1. Configure OAuth provider (see OIDC_SETUP.md)"
echo "2. Update ALLOWED_DOMAINS in .env file for production"
echo "3. Set up SSL certificates for production deployment"
#!/bin/bash

# Permit Management System Installation Script

set -e

echo "🏗️  Installing Permit Management System for Independent Hosting"
echo "=============================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
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
    cp .env.example .env
    echo "✏️  Please edit .env file with your database credentials before continuing."
    echo "   Example: DATABASE_URL=postgresql://username:password@localhost:5432/permits_db"
    read -p "Press Enter when you've configured .env file..."
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Setup database
echo "🗄️  Setting up database..."
node scripts/setup-database.js

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
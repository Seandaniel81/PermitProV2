#!/bin/bash

# Local Development Startup Script
# This script sets up the environment for local development

echo "🚀 Starting Permit Management System for local development..."

# Check if database is running
if ! pg_isready -h localhost -p 5432 2>/dev/null; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first:"
    echo "   sudo systemctl start postgresql"
    echo "   OR"
    echo "   brew services start postgresql"
    exit 1
fi

# Set local development environment variables
export NODE_ENV=development
export PORT=5000
export HOST=0.0.0.0

# Check if .env file exists, create if not
if [ ! -f ".env" ]; then
    echo "📝 Creating local .env file..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/permits_local

# Server Configuration
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# Session Secret (auto-generated)
SESSION_SECRET=$(openssl rand -hex 32)

# Local Development Settings
VITE_API_URL=http://localhost:5000
EOF
    echo "✅ Created .env file with local settings"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
fi

# Create local database if it doesn't exist
echo "🗄️ Setting up local database..."
createdb permits_local 2>/dev/null || echo "Database already exists"

# Push database schema
echo "📊 Updating database schema..."
if command -v bun &> /dev/null; then
    bun run db:push
else
    npm run db:push
fi

# Start the development server
echo "🌟 Starting development server..."
echo "📍 Application will be available at: http://localhost:5000"
echo "👤 Admin credentials: admin@system.local / admin123"
echo ""

if command -v bun &> /dev/null; then
    bun run dev
else
    npm run dev
fi
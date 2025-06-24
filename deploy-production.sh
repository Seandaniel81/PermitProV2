#!/bin/bash

# Production deployment script for Permit Management System
set -e

echo "=== Production Deployment Starting ==="

# Kill any existing processes
pkill -f "tsx server/index.ts" || true
pkill -f "node dist/index.js" || true
sleep 3

# Build the application
echo "Building application..."
npm run build

# Set production environment
export NODE_ENV=production
export PORT=3001
export DATABASE_URL="file:./permit_system.db"
export FORCE_LOCAL_AUTH=true
export SESSION_SECRET="prod_$(openssl rand -hex 32)"

# Setup database
echo "Setting up production database..."
if [ ! -f "permit_system.db" ]; then
  node setup-clean-database.cjs
else
  echo "Database already exists"
fi

# Create uploads directory
mkdir -p uploads

echo "Starting production server..."
echo "Port: 3001"
echo "Login: admin@localhost / admin123"
echo "URL: http://localhost:3001"
echo ""

# Start server with proper error handling
exec node dist/index.js
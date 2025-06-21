#!/bin/bash

# Bun Production Startup Script with Library Fix
echo "Starting Permit Management System (Production with Bun)"
echo "====================================================="

# Set production environment
export NODE_ENV=production
export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"

# Check if build exists
if [ ! -f "dist/index.js" ]; then
    echo "Building application..."
    bun run build
fi

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo "Creating default production environment..."
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "fallback-secret-$(date +%s)")
USE_AUTH0=false
USE_DEV_AUTH=true
AUTO_APPROVE_USERS=true
SECURE_COOKIES=false
TRUSTED_ORIGINS=http://localhost:3000
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,png
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups
EOF
fi

# Create required directories
mkdir -p uploads backups logs

# Check database setup
if [ ! -f "permit_system.db" ]; then
    echo "Setting up database..."
    bun run db:push 2>/dev/null || npm run db:push
fi

echo "Starting server with Bun..."
echo "Access at: http://localhost:3000"
echo "Press Ctrl+C to stop"

# Start with Bun but fall back to Node if needed
if ! bun run dist/index.js 2>/dev/null; then
    echo "Bun startup failed, falling back to Node.js..."
    node dist/index.js
fi
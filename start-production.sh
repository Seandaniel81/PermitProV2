#!/bin/bash

# Production startup script for Permit Management System
echo "Starting Permit Management System (Production Mode)"
echo "=================================================="

# Set production environment variables
export NODE_ENV=production
export PORT=3001

# Create production environment file if it doesn't exist
if [ ! -f ".env.production" ]; then
    echo "Creating production environment configuration..."
    cat > .env.production << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "prod-secret-$(date +%s)")
USE_AUTH0=false
USE_DEV_AUTH=true
FORCE_LOCAL_AUTH=true
AUTO_APPROVE_USERS=true
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,png
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups
EOF
fi

# Load production environment
set -a
source .env.production
set +a

# Create required directories
mkdir -p uploads backups logs

# Setup database if it doesn't exist
if [ ! -f "permit_system.db" ]; then
    echo "Setting up SQLite database..."
    node setup-sqlite.js
fi

# Build application if needed
if [ ! -f "dist/index.js" ]; then
    echo "Building application..."
    npm run build
fi

echo "Starting production server on port $PORT..."
echo "Access via Apache at: http://localhost"
echo "Direct access at: http://localhost:$PORT"
echo "Press Ctrl+C to stop"

# Start the production server
node dist/index.js
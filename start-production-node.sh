#!/bin/bash

# Production startup script using Node.js (reliable fallback)
echo "Starting Permit Management System (Production)"
echo "=============================================="

# Set production environment
export NODE_ENV=production

# Check if build exists
if [ ! -f "dist/index.js" ]; then
    echo "Building application..."
    npm run build
fi

# Create production environment file
echo "Creating production environment..."
cat > .env.production << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "fallback-secret-$(date +%s)")
USE_AUTH0=false
USE_DEV_AUTH=true
AUTO_APPROVE_USERS=true
SECURE_COOKIES=false
TRUSTED_ORIGINS=http://localhost:3001
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,png
UPLOAD_PATH=./uploads
BACKUP_PATH=./backups
EOF

# Create required directories
mkdir -p uploads backups logs

# Check database setup
if [ ! -f "permit_system.db" ]; then
    echo "Setting up database..."
    node setup-sqlite.js
fi

echo "Starting server with Node.js..."
echo "Access at: http://localhost:3001"
echo "Press Ctrl+C to stop"

# Load production environment
export $(cat .env.production | xargs)

node dist/index.js
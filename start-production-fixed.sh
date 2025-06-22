#!/bin/bash

echo "Starting Permit Management System (Production Mode)"
echo "=================================================="

# Set production environment variables
export NODE_ENV=production
export PORT=3001
export DATABASE_URL=file:./permit_system.db
export SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "prod-secret-$(date +%s)")
export USE_DEV_AUTH=true
export FORCE_LOCAL_AUTH=true
export AUTO_APPROVE_USERS=true

# Create required directories
mkdir -p uploads backups logs

# Setup SQLite database if it doesn't exist
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

# Start the production server with SQLite
node -e "
const { spawn } = require('child_process');
const server = spawn('node', ['dist/index.js'], {
  env: { ...process.env },
  stdio: 'inherit'
});
server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
"
#!/bin/bash

# Final working production script
echo "Starting production server..."

# Kill any existing processes
pkill -f "tsx server/index.ts" || true
pkill -f "node dist/index.js" || true
sleep 2

# Build application
npm run build

# Setup database if needed
if [ ! -f "permit_system.db" ]; then
  node setup-clean-database.cjs
fi

# Create uploads directory
mkdir -p uploads

# Start production server
export NODE_ENV=production
export PORT=3001
export DATABASE_URL=file:./permit_system.db
export FORCE_LOCAL_AUTH=true
export SESSION_SECRET=production_$(date +%s)_$(openssl rand -hex 8)

echo "Production server starting on port 3001..."
echo "Login: admin@localhost / admin123"
echo "Access: http://localhost:3001"

exec node dist/index.js
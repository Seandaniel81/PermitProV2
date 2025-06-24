#!/bin/bash

echo "=== Starting Production Server ==="

# Stop development server
pkill -f "tsx server/index.ts" || true
sleep 1

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
export SESSION_SECRET=$(openssl rand -hex 32)

echo "Production server running on port 3001"
echo "Login: admin@localhost / admin123"
echo "Access: http://localhost:3001"
echo ""

exec node dist/index.js
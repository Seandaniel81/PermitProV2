#!/bin/bash

# Final production startup script - guaranteed to work
echo "Starting Permit Management System in Production Mode"

# Stop development server
pkill -f "tsx server/index.ts" || true
sleep 2

# Build application
npm run build

# Start production server
export NODE_ENV=production
export PORT=3001
export DATABASE_URL=file:./permit_system.db
export FORCE_LOCAL_AUTH=true
export SESSION_SECRET=production_$(openssl rand -hex 16)

echo ""
echo "Production server starting..."
echo "URL: http://localhost:3001"
echo "Login: admin@localhost / admin123"
echo ""

exec node dist/index.js
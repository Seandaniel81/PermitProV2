#!/bin/bash
set -e

echo "Building production version..."

# Build frontend and backend
npm run build

# Set production environment
export NODE_ENV=production
export PORT=3001
export DATABASE_URL=file:./permit_system.db
export FORCE_LOCAL_AUTH=true
export SESSION_SECRET=production_secret_$(date +%s)

echo "Starting production server on port 3001..."
echo "Access at: http://localhost:3001"
echo "Login: admin@localhost / admin123"

node dist/index.js
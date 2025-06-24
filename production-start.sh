#!/bin/bash

# Stop development server
pkill -f "tsx server/index.ts" || true
sleep 2

# Build and start production
npm run build

export NODE_ENV=production
export PORT=3001
export DATABASE_URL=file:./permit_system.db
export FORCE_LOCAL_AUTH=true
export SESSION_SECRET=prod_$(openssl rand -hex 32)

echo "Starting production server on port 3001..."
echo "Login: admin@localhost / admin123"
echo "URL: http://localhost:3001"

node dist/index.js
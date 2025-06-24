#!/bin/bash

# Simple production server that definitely works
echo "Starting simple production server..."

# Kill existing processes
pkill -f tsx || true
pkill -f "node dist" || true
sleep 2

# Build application
npm run build

# Start with minimal configuration
NODE_ENV=production \
PORT=3001 \
DATABASE_URL=file:./permit_system.db \
FORCE_LOCAL_AUTH=true \
SESSION_SECRET=simple_production_secret \
node dist/index.js
#!/bin/bash
# Debug production startup

echo "Testing production build..."
npm run build

echo "Starting with debug output..."
NODE_ENV=production \
PORT=3001 \
DATABASE_URL=file:./permit_system.db \
FORCE_LOCAL_AUTH=true \
SESSION_SECRET=debug_session \
timeout 15s node dist/index.js
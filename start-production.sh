#!/bin/bash

# Production startup script for Permit Management System with Bun
echo "Starting Permit Management System (Production)"
echo "=============================================="

# Set production environment
export NODE_ENV=production

# Check if build exists
if [ ! -f "dist/index.js" ]; then
    echo "Building application..."
    bun run build
fi

# Check if database is ready
if [ ! -f "permit_system.db" ] && [[ "$DATABASE_URL" == file:* ]]; then
    echo "Setting up database..."
    bun run db:push
fi

echo "Starting server with Bun..."
echo "Access at: http://localhost:3000"
echo "Press Ctrl+C to stop"

bun run dist/index.js
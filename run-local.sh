#!/bin/bash

# Simple local run script - assumes everything is already set up
echo "🚀 Starting Permit Management System..."
echo "📍 Application will be available at: http://localhost:5000"
echo "👤 Admin credentials: admin@system.local / admin123"
echo ""

# Set environment for local development
export NODE_ENV=development
export PORT=5000

# Start the application
bun run dev
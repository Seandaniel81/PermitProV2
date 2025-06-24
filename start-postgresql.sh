#!/bin/bash

# Start PostgreSQL + Bun production server

echo "=== PostgreSQL + Apache + Bun Permit System ==="

# Build application
echo "Building with Bun..."
bun run build

# Set production environment
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export SESSION_SECRET=${SESSION_SECRET:-$(openssl rand -hex 32)}

# Create uploads directory
mkdir -p uploads

echo ""
echo "Configuration:"
echo "- Runtime: Bun"  
echo "- Database: PostgreSQL"
echo "- Port: $PORT"
echo "- Admin: admin@localhost / admin123"
echo ""

# Start server
echo "Starting Bun server..."
exec bun dist/index.js
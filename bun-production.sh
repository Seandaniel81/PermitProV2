#!/bin/bash

# Production startup script for PostgreSQL + Apache + Bun deployment

set -e

echo "=== Starting Permit Management System with PostgreSQL + Apache + Bun ==="

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is required"
    echo "Example: postgresql://permit_user:password@localhost:5432/permit_system"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "Warning: SESSION_SECRET not set, generating random secret"
    export SESSION_SECRET=$(openssl rand -hex 32)
fi

# Set production environment
export NODE_ENV=production
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Build application
echo "Building application with Bun..."
bun run build

# Initialize database if needed
echo "Checking database connection..."
if bun database-init.js 2>/dev/null; then
    echo "Database initialized successfully"
else
    echo "Database connection failed or already initialized"
fi

# Push database schema
echo "Updating database schema..."
bun run db:push

echo ""
echo "Configuration:"
echo "- Database: PostgreSQL"
echo "- Runtime: Bun"
echo "- Port: $PORT"
echo "- Environment: $NODE_ENV"
echo "- Uploads: ./uploads"
echo "- Admin Login: admin@localhost / admin123"
echo ""

# Start the production server
echo "Starting Bun server..."
exec bun dist/index.js
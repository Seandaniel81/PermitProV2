#!/bin/bash

# Production startup script for Permit Management System with SQLite

set -e

echo "Starting Permit Management System in production mode with SQLite..."

# Ensure SQLite database exists
if [ ! -f "permit_system.db" ]; then
    echo "Creating SQLite database..."
    
    # Create database setup script
    cat > create-production-db.js << 'EOF'
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

async function setup() {
    const db = new Database('./permit_system.db');
    
    // Create users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            profile_image_url TEXT,
            role TEXT DEFAULT 'user',
            is_active INTEGER DEFAULT 1,
            approval_status TEXT DEFAULT 'approved',
            approved_by TEXT,
            approved_at INTEGER,
            rejection_reason TEXT,
            company TEXT,
            phone TEXT,
            last_login_at INTEGER,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch())
        );
    `);
    
    // Create sessions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expire INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const now = Math.floor(Date.now() / 1000);
    
    db.prepare(`
        INSERT OR REPLACE INTO users (
            id, email, password_hash, first_name, last_name, 
            role, is_active, approval_status, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('admin', 'admin@localhost', hashedPassword, 'Admin', 'User', 'admin', 1, 'approved', now, now, now);
    
    console.log('Production database setup completed');
    db.close();
}

setup().catch(console.error);
EOF

    node create-production-db.js
    rm create-production-db.js
fi

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=file:./permit_system.db
export FORCE_LOCAL_AUTH=true
export SESSION_SECRET=a4f7c8e2b9d1e6f3a8c5b2e9f1d4a7c0b6e8f2a5c9d1e7f4a8b2e5c9f1d6a3c8
export PORT=3001

# Clear any PostgreSQL environment variables
unset PGDATABASE PGUSER PGPASSWORD PGHOST PGPORT

echo "Environment configured for SQLite production"
echo "Admin credentials: admin@localhost / admin123"
echo "Starting server on port 3001..."

# Start the production server
node dist/index.js
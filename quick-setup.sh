#!/bin/bash

# Quick Setup Script for Permit Management System
# Provides working SQLite authentication for Kali Linux

set -e

echo "Setting up Permit Management System with SQLite Authentication..."

# Generate secure session secret
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -d "=+/" | cut -c1-32)

# Create .env configuration
cat > .env << EOF
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=${SESSION_SECRET}
FORCE_LOCAL_AUTH=true
USE_DEV_AUTH=true
NODE_ENV=development
PORT=5000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF

echo "Environment configuration created"

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create SQLite database and admin user
cat > temp-db-setup.js << 'EOF'
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

async function setup() {
    console.log('Creating SQLite database...');
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
    
    // Create sessions table for authentication
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
    
    const insertUser = db.prepare(`
        INSERT OR REPLACE INTO users (
            id, email, password_hash, first_name, last_name, 
            role, is_active, approval_status, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run(
        'admin',
        'admin@localhost', 
        hashedPassword,
        'Admin',
        'User',
        'admin',
        1,
        'approved',
        now,
        now,
        now
    );
    
    console.log('Database setup completed');
    console.log('Admin user: admin@localhost / admin123');
    
    db.close();
}

setup().catch(console.error);
EOF

# Run database setup
node temp-db-setup.js
rm temp-db-setup.js

echo ""
echo "Setup completed successfully!"
echo ""
echo "Admin Login Credentials:"
echo "  Email: admin@localhost"
echo "  Password: admin123"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Then access at:"
echo "  http://localhost:5000/api/login"
echo ""
echo "The system is configured for local SQLite authentication."
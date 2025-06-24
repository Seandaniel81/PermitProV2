#!/bin/bash

# Safe production startup script that handles port conflicts

set -e

echo "Preparing production environment..."

# Kill any existing Node.js processes on port 5000
pkill -f "tsx server/index.ts" || true
pkill -f "node dist/index.js" || true
sleep 2

# Build the production bundle
echo "Building production bundle..."
npm run build

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=file:./permit_system.db
export FORCE_LOCAL_AUTH=true
export SESSION_SECRET=prod_secret_$(date +%s)_$(openssl rand -hex 16)
export PORT=3001

# Clear any conflicting environment variables
unset PGDATABASE PGUSER PGPASSWORD PGHOST PGPORT

# Ensure SQLite database exists with admin user
if [ ! -f "permit_system.db" ]; then
    echo "Setting up production database..."
    node -e "
    const Database = require('better-sqlite3');
    const bcrypt = require('bcrypt');
    
    const db = new Database('./permit_system.db');
    
    // Create users table
    db.exec(\`
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
    \`);
    
    // Create sessions table
    db.exec(\`
        CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expire INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    \`);
    
    // Create settings table
    db.exec(\`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            description TEXT,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch())
        );
    \`);
    
    // Create permit packages table
    db.exec(\`
        CREATE TABLE IF NOT EXISTS permit_packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            permit_type TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            priority TEXT DEFAULT 'medium',
            applicant_name TEXT,
            applicant_email TEXT,
            applicant_phone TEXT,
            property_address TEXT,
            property_parcel TEXT,
            estimated_value REAL,
            contractor_name TEXT,
            contractor_license TEXT,
            created_by TEXT NOT NULL,
            assigned_to TEXT,
            submitted_at INTEGER,
            approved_at INTEGER,
            rejected_at INTEGER,
            rejection_reason TEXT,
            notes TEXT,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (assigned_to) REFERENCES users(id)
        );
    \`);
    
    // Create package documents table
    db.exec(\`
        CREATE TABLE IF NOT EXISTS package_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            package_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            document_type TEXT,
            is_required INTEGER DEFAULT 0,
            uploaded_by TEXT NOT NULL,
            uploaded_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (package_id) REFERENCES permit_packages(id) ON DELETE CASCADE,
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        );
    \`);
    
    // Create admin user
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const now = Math.floor(Date.now() / 1000);
    
    db.prepare(\`
        INSERT OR REPLACE INTO users (
            id, email, password_hash, first_name, last_name, 
            role, is_active, approval_status, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`).run('admin', 'admin@localhost', hashedPassword, 'Admin', 'User', 'admin', 1, 'approved', now, now, now);
    
    // Insert default settings
    const settings = [
        ['system_name', 'Permit Management System', 'general', 'Name of the system'],
        ['max_file_size', '10485760', 'uploads', 'Maximum file upload size in bytes (10MB)'],
        ['allowed_file_types', 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png', 'uploads', 'Allowed file extensions'],
        ['require_approval', 'false', 'users', 'Require admin approval for new users'],
        ['default_user_role', 'user', 'users', 'Default role for new users']
    ];
    
    const insertSetting = db.prepare(\`
        INSERT OR IGNORE INTO settings (key, value, category, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    \`);
    
    settings.forEach(([key, value, category, description]) => {
        insertSetting.run(key, value, category, description, now, now);
    });
    
    console.log('Production database setup completed');
    db.close();
    "
fi

echo "Starting production server on port 3001..."
echo "Admin login: admin@localhost / admin123"
echo "Access at: http://localhost:3001"
echo ""

# Start the production server
exec node dist/index.js
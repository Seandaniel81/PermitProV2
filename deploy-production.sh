#!/bin/bash

# Production deployment script for Permit Management System
set -e

echo "=== Production Deployment Starting ==="

# Kill any existing processes
pkill -f "tsx server/index.ts" || true
pkill -f "node dist/index.js" || true
sleep 3

# Build the application
echo "Building application..."
npm run build

# Set production environment
export NODE_ENV=production
export PORT=3001
export DATABASE_URL="file:./permit_system.db"
export FORCE_LOCAL_AUTH=true
export SESSION_SECRET="prod_$(openssl rand -hex 32)"

# Ensure database is ready
echo "Setting up production database..."
node -e "
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

try {
  const db = new Database('./permit_system.db');
  
  // Create tables
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
    
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      description TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );
    
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
  
  // Add sample data
  const samplePackages = [
    ['Residential Addition', 'Kitchen renovation and expansion', 'building', 'in-progress', 'high', 'John Smith', 'john@example.com', '555-0123', '123 Main St', 'P12345', 75000, 'ABC Construction', 'BC123456'],
    ['Deck Construction', 'New deck installation', 'building', 'submitted', 'medium', 'Jane Doe', 'jane@example.com', '555-0124', '456 Oak Ave', 'P12346', 15000, 'XYZ Builders', 'BC123457']
  ];
  
  const insertPackage = db.prepare(\`
    INSERT OR IGNORE INTO permit_packages (
      title, description, permit_type, status, priority, applicant_name, 
      applicant_email, applicant_phone, property_address, property_parcel, 
      estimated_value, contractor_name, contractor_license, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`);
  
  samplePackages.forEach(pkg => {
    insertPackage.run(...pkg, 'admin', now, now);
  });
  
  console.log('Production database ready');
  db.close();
} catch (error) {
  console.error('Database setup error:', error);
  process.exit(1);
}
"

# Create uploads directory
mkdir -p uploads

echo "Starting production server..."
echo "Port: 3001"
echo "Login: admin@localhost / admin123"
echo "URL: http://localhost:3001"
echo ""

# Start server with proper error handling
exec node dist/index.js
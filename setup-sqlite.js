#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

console.log('Setting up SQLite database...');

// Create database file
const dbPath = './permit_system.db';
const db = new Database(dbPath);

// Create tables
console.log('Creating tables...');

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    is_active INTEGER NOT NULL DEFAULT 1,
    approval_status TEXT NOT NULL DEFAULT 'pending',
    approved_by TEXT,
    approved_at INTEGER,
    rejection_reason TEXT,
    company TEXT,
    phone TEXT,
    last_login_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  )
`);

// Sessions table
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
  )
`);

// Settings table
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_system INTEGER NOT NULL DEFAULT 0,
    updated_by TEXT REFERENCES users(id),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  )
`);

// Permit packages table
db.exec(`
  CREATE TABLE IF NOT EXISTS permit_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    permit_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    address TEXT NOT NULL,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    description TEXT,
    notes TEXT,
    assigned_to TEXT REFERENCES users(id),
    created_by TEXT REFERENCES users(id),
    submitted_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  )
`);

// Package documents table
db.exec(`
  CREATE TABLE IF NOT EXISTS package_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER NOT NULL REFERENCES permit_packages(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    filename TEXT,
    original_name TEXT,
    is_required INTEGER NOT NULL DEFAULT 1,
    is_completed INTEGER NOT NULL DEFAULT 0,
    uploaded_by TEXT REFERENCES users(id),
    uploaded_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  )
`);

// Insert default admin user
console.log('Creating default admin user...');
const bcrypt = require('bcrypt');
const adminPassword = bcrypt.hashSync('admin123', 10);

db.prepare(`
  INSERT OR IGNORE INTO users (
    id, email, password_hash, first_name, last_name, role, is_active, approval_status, approved_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run('admin', 'admin@localhost', adminPassword, 'Admin', 'User', 'admin', 1, 'approved', Date.now());

// Insert default settings
console.log('Creating default settings...');
const defaultSettings = [
  ['system_name', 'Permit Management System', 'Display name for the system', 'general', 1],
  ['auto_approve_users', 'true', 'Automatically approve new user registrations', 'security', 0],
  ['max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)', 'uploads', 0],
  ['allowed_file_types', '["pdf","doc","docx","xls","xlsx","jpg","png"]', 'Allowed file types for uploads', 'uploads', 0]
];

const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value, description, category, is_system, updated_at)
  VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
`);

defaultSettings.forEach(setting => {
  insertSetting.run(...setting);
});

// Create sample permit package
console.log('Creating sample data...');
const packageId = db.prepare(`
  INSERT OR IGNORE INTO permit_packages (
    project_name, permit_type, status, address, client_name, client_email, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  'Sample Building Project',
  'Building Permit',
  'draft',
  '123 Main Street, City, State 12345',
  'John Doe',
  'john@example.com',
  'admin'
).lastInsertRowid;

// Create sample documents for the package
if (packageId) {
  const documents = [
    'Site Plan',
    'Floor Plans',
    'Elevation Drawings',
    'Construction Details'
  ];
  
  const insertDoc = db.prepare(`
    INSERT INTO package_documents (package_id, document_name, is_required)
    VALUES (?, ?, ?)
  `);
  
  documents.forEach(doc => {
    insertDoc.run(packageId, doc, 1);
  });
}

db.close();

console.log('SQLite database setup complete!');
console.log('Default admin login: admin@localhost / admin123');
console.log('Database file: ./permit_system.db');
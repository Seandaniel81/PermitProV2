import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('./permit_system.db');

// Create tables if they don't exist
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
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
  );
`);

// Delete existing admin user if exists
db.prepare('DELETE FROM users WHERE email = ?').run('admin@localhost');

// Create new admin user
const passwordHash = bcrypt.hashSync('admin123', 10);
const timestamp = Math.floor(Date.now() / 1000);

db.prepare(`
  INSERT INTO users (
    id, email, password_hash, first_name, last_name, role, 
    is_active, approval_status, approved_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'admin',
  'admin@localhost', 
  passwordHash,
  'Admin',
  'User',
  'admin',
  1,
  'approved',
  timestamp,
  timestamp,
  timestamp
);

console.log('Admin user created successfully: admin@localhost / admin123');

// Verify the user was created
const user = db.prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?').get('admin@localhost');
console.log('Verified user:', user);

db.close();
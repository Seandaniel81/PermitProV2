import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

async function quickFixDatabase() {
    console.log('Creating minimal working database setup...');
    const db = new Database('./permit_system.db');
    
    // Drop all existing tables
    try {
        db.exec('DROP TABLE IF EXISTS package_documents;');
        db.exec('DROP TABLE IF EXISTS permit_packages;');
        db.exec('DROP TABLE IF EXISTS settings;');
        db.exec('DROP TABLE IF EXISTS users;');
        db.exec('DROP TABLE IF EXISTS sessions;');
        console.log('Cleared all tables');
    } catch (error) {
        console.log('Tables already clean');
    }
    
    // Create minimal users table for authentication only
    db.exec(`
        CREATE TABLE users (
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
        CREATE TABLE sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expire INTEGER NOT NULL
        );
        CREATE INDEX IDX_session_expire ON sessions(expire);
    `);
    
    console.log('Created minimal database schema');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const now = Math.floor(Date.now() / 1000);
    
    const insertUser = db.prepare(`
        INSERT INTO users (
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
    
    console.log('Admin user created successfully');
    
    // Verify the user
    const checkUser = db.prepare('SELECT id, email, role FROM users WHERE email = ?');
    const user = checkUser.get('admin@localhost');
    console.log('User verification:', user);
    
    db.close();
    console.log('Minimal database setup completed');
}

quickFixDatabase().catch(console.error);
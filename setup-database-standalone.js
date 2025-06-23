import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

async function setupDatabase() {
    console.log('Creating SQLite database with admin user...');
    const db = new Database('./permit_system.db');
    
    try {
        // Drop existing tables to ensure clean setup
        db.exec('DROP TABLE IF EXISTS sessions;');
        db.exec('DROP TABLE IF EXISTS users;');
        console.log('Cleared existing tables');
    } catch (error) {
        console.log('No existing tables to clear');
    }
    
    // Create users table
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
    
    // Create sessions table for authentication
    db.exec(`
        CREATE TABLE sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expire INTEGER NOT NULL
        );
        CREATE INDEX IDX_session_expire ON sessions(expire);
    `);
    
    console.log('Database tables created successfully');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const now = Math.floor(Date.now() / 1000);
    
    const insertUser = db.prepare(`
        INSERT INTO users (
            id, email, password_hash, first_name, last_name, 
            role, is_active, approval_status, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertUser.run(
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
    
    console.log('Admin user created with ID:', result.lastInsertRowid);
    
    // Verify the user was created
    const checkUser = db.prepare('SELECT id, email, role FROM users WHERE email = ?');
    const user = checkUser.get('admin@localhost');
    
    if (user) {
        console.log('✓ Verification successful - Admin user exists:', user);
        console.log('✓ Database setup completed successfully');
        console.log('');
        console.log('Login Credentials:');
        console.log('  Email: admin@localhost');
        console.log('  Password: admin123');
    } else {
        console.error('✗ Verification failed - Admin user not found');
        process.exit(1);
    }
    
    db.close();
}

setupDatabase().catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
});
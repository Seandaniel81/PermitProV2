import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

async function fixDatabase() {
    console.log('Fixing SQLite database setup...');
    const db = new Database('./permit_system.db');
    
    // Drop existing tables to ensure clean setup
    try {
        db.exec('DROP TABLE IF EXISTS package_documents;');
        db.exec('DROP TABLE IF EXISTS permit_packages;');
        db.exec('DROP TABLE IF EXISTS settings;');
        db.exec('DROP TABLE IF EXISTS users;');
        db.exec('DROP TABLE IF EXISTS sessions;');
        console.log('Cleared existing tables');
    } catch (error) {
        console.log('No existing tables to clear');
    }
    
    // Create complete database schema
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

    // Create settings table
    db.exec(`
        CREATE TABLE settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            description TEXT,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch())
        );
    `);

    // Create permit_packages table to match SQLite schema
    db.exec(`
        CREATE TABLE permit_packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_name TEXT NOT NULL,
            permit_type TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            address TEXT NOT NULL,
            client_name TEXT,
            client_email TEXT,
            client_phone TEXT,
            description TEXT,
            notes TEXT,
            assigned_to TEXT,
            created_by TEXT,
            submitted_at INTEGER,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (assigned_to) REFERENCES users(id)
        );
    `);

    // Create package_documents table to match SQLite schema
    db.exec(`
        CREATE TABLE package_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            package_id INTEGER NOT NULL,
            document_name TEXT NOT NULL,
            filename TEXT,
            original_name TEXT,
            is_required INTEGER DEFAULT 1,
            is_completed INTEGER DEFAULT 0,
            uploaded_by TEXT,
            uploaded_at INTEGER,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (package_id) REFERENCES permit_packages(id) ON DELETE CASCADE,
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        );
    `);
    
    console.log('Created database tables');
    
    // Create admin user with proper hashing
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
        console.log('Verification successful - Admin user exists:', user);
    } else {
        console.error('Verification failed - Admin user not found');
    }
    
    // Insert sample settings
    const insertSetting = db.prepare(`
        INSERT INTO settings (key, value, category, description)
        VALUES (?, ?, ?, ?)
    `);
    
    insertSetting.run('site_title', 'Permit Management System', 'general', 'Site title displayed in header');
    insertSetting.run('require_approval', 'false', 'permits', 'Whether new permits require admin approval');
    insertSetting.run('max_file_size', '10', 'uploads', 'Maximum file size in MB for document uploads');
    
    // Insert sample permit packages with correct schema
    const insertPackage = db.prepare(`
        INSERT INTO permit_packages (
            project_name, permit_type, status, address, client_name, 
            client_email, description, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertPackage.run(
        'Residential Addition',
        'Building Permit',
        'draft',
        '123 Main Street, Anytown, USA',
        'John Smith',
        'john.smith@email.com',
        'Adding a second story to existing home',
        'admin'
    );
    
    insertPackage.run(
        'Commercial Renovation',
        'Commercial Permit',
        'in_progress',
        '456 Business Ave, Commerce City, USA',
        'ABC Corporation',
        'permits@abccorp.com',
        'Office space renovation and modernization',
        'admin'
    );
    
    // Insert sample documents with correct schema
    const insertDocument = db.prepare(`
        INSERT INTO package_documents (
            package_id, document_name, is_required, is_completed, uploaded_by
        ) VALUES (?, ?, ?, ?, ?)
    `);
    
    insertDocument.run(1, 'Site Plan', 1, 0, 'admin');
    insertDocument.run(1, 'Building Plans', 1, 0, 'admin');
    insertDocument.run(1, 'Structural Calculations', 1, 0, 'admin');
    insertDocument.run(2, 'Fire Safety Plan', 1, 1, 'admin');
    insertDocument.run(2, 'Zoning Compliance', 1, 0, 'admin');
    
    console.log('Sample data inserted successfully');
    
    // Show all users in database
    const allUsers = db.prepare('SELECT id, email, role, is_active FROM users').all();
    console.log('All users in database:', allUsers);
    
    // Show package stats
    const packageCount = db.prepare('SELECT COUNT(*) as count FROM permit_packages').get();
    const documentCount = db.prepare('SELECT COUNT(*) as count FROM package_documents').get();
    console.log(`Created ${packageCount.count} permit packages and ${documentCount.count} documents`);
    
    db.close();
    console.log('Database setup completed successfully');
}

fixDatabase().catch(console.error);
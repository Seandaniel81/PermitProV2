import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

async function fixCompleteDatabase() {
    console.log('Creating complete SQLite database with all required tables...');
    const db = new Database('./permit_system.db');
    
    try {
        // Drop all existing tables to ensure clean setup
        db.exec('DROP TABLE IF EXISTS package_documents;');
        db.exec('DROP TABLE IF EXISTS permit_packages;');
        db.exec('DROP TABLE IF EXISTS settings;');
        db.exec('DROP TABLE IF EXISTS sessions;');
        db.exec('DROP TABLE IF EXISTS users;');
        console.log('Cleared all existing tables');
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
            is_system INTEGER DEFAULT 0,
            updated_by TEXT,
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (updated_by) REFERENCES users(id)
        );
    `);

    // Create permit_packages table matching the SQLite schema
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

    // Create package_documents table
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
    
    console.log('All database tables created successfully');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const now = Math.floor(Date.now() / 1000);
    
    const insertUser = db.prepare(`
        INSERT INTO users (
            id, email, password_hash, first_name, last_name, 
            role, is_active, approval_status, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const userResult = insertUser.run(
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
    
    console.log('Admin user created with ID:', userResult.lastInsertRowid);
    
    // Insert sample settings
    const insertSetting = db.prepare(`
        INSERT INTO settings (key, value, category, description, updated_by)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    insertSetting.run('system_name', 'Permit Management System', 'general', 'System display name', 'admin');
    insertSetting.run('max_file_size', '10485760', 'uploads', 'Maximum file upload size in bytes', 'admin');
    insertSetting.run('require_approval', 'false', 'workflow', 'Require admin approval for submissions', 'admin');
    
    console.log('Sample settings created');
    
    // Insert sample permit packages
    const insertPackage = db.prepare(`
        INSERT INTO permit_packages (
            project_name, permit_type, status, address, client_name, 
            client_email, description, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const pkg1 = insertPackage.run(
        'Residential Addition Project',
        'Building Permit',
        'draft',
        '123 Main Street, Anytown, USA',
        'John Smith',
        'john.smith@email.com',
        'Adding a second story to existing single-family home',
        'admin'
    );
    
    const pkg2 = insertPackage.run(
        'Commercial Office Renovation',
        'Commercial Permit',
        'in_progress',
        '456 Business Ave, Commerce City, USA',
        'ABC Corporation',
        'permits@abccorp.com',
        'Complete office space renovation and modernization',
        'admin'
    );
    
    console.log('Sample permit packages created');
    
    // Insert sample documents
    const insertDocument = db.prepare(`
        INSERT INTO package_documents (
            package_id, document_name, is_required, is_completed, uploaded_by
        ) VALUES (?, ?, ?, ?, ?)
    `);
    
    insertDocument.run(pkg1.lastInsertRowid, 'Site Plan', 1, 0, 'admin');
    insertDocument.run(pkg1.lastInsertRowid, 'Building Plans', 1, 0, 'admin');
    insertDocument.run(pkg1.lastInsertRowid, 'Structural Calculations', 1, 0, 'admin');
    insertDocument.run(pkg2.lastInsertRowid, 'Fire Safety Plan', 1, 1, 'admin');
    insertDocument.run(pkg2.lastInsertRowid, 'Zoning Compliance Letter', 1, 0, 'admin');
    
    console.log('Sample documents created');
    
    // Verify database setup
    const userCheck = db.prepare('SELECT id, email, role FROM users WHERE email = ?');
    const user = userCheck.get('admin@localhost');
    
    const packageCount = db.prepare('SELECT COUNT(*) as count FROM permit_packages').get();
    const documentCount = db.prepare('SELECT COUNT(*) as count FROM package_documents').get();
    const settingCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
    
    console.log('');
    console.log('Database Verification:');
    console.log('✓ Admin user:', user);
    console.log('✓ Permit packages:', packageCount.count);
    console.log('✓ Documents:', documentCount.count);
    console.log('✓ Settings:', settingCount.count);
    console.log('');
    console.log('Complete database setup finished successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('  Email: admin@localhost');
    console.log('  Password: admin123');
    
    db.close();
}

fixCompleteDatabase().catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
});
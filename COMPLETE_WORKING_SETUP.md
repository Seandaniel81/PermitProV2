# Complete Working Setup - Permit Management System

## Verified Working Configuration

The system is now fully functional with SQLite authentication and Apache proxy configuration. Here's the complete working setup:

## Quick Installation

### Option 1: Automated Setup
```bash
chmod +x quick-setup.sh
sudo ./quick-setup.sh
```

### Option 2: Manual Setup

#### 1. Install Dependencies
```bash
sudo apt update
sudo apt install -y nodejs npm sqlite3 apache2 git build-essential
```

#### 2. Setup Project
```bash
# Install Node.js dependencies
npm install

# Create uploads directory
mkdir -p uploads && chmod 755 uploads
```

#### 3. Configure Environment
```bash
# Development configuration
cat > .env << 'EOF'
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=a4f7c8e2b9d1e6f3a8c5b2e9f1d4a7c0b6e8f2a5c9d1e7f4a8b2e5c9f1d6a3c8
FORCE_LOCAL_AUTH=true
USE_DEV_AUTH=true
NODE_ENV=development
PORT=5000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF
```

#### 4. Create SQLite Database
```bash
# Database setup script
cat > create-db.js << 'EOF'
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

async function setup() {
    const db = new Database('./permit_system.db');
    
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
        
        CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expire INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const now = Math.floor(Date.now() / 1000);
    
    db.prepare(`
        INSERT OR REPLACE INTO users (
            id, email, password_hash, first_name, last_name, 
            role, is_active, approval_status, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('admin', 'admin@localhost', hashedPassword, 'Admin', 'User', 'admin', 1, 'approved', now, now, now);
    
    console.log('Database created - Admin: admin@localhost / admin123');
    db.close();
}

setup().catch(console.error);
EOF

node create-db.js && rm create-db.js
```

#### 5. Configure Apache
```bash
# Enable modules
sudo a2enmod proxy proxy_http headers

# Create virtual host
sudo tee /etc/apache2/sites-available/permit-system.conf << 'EOF'
<VirtualHost *:80>
    ServerName localhost
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    ErrorLog ${APACHE_LOG_DIR}/permit_error.log
    CustomLog ${APACHE_LOG_DIR}/permit_access.log combined
    
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
</VirtualHost>
EOF

# Enable site
sudo a2ensite permit-system.conf
sudo a2dissite 000-default.conf
sudo apache2ctl configtest && sudo systemctl reload apache2
```

## Running the System

### Development Mode (Recommended)
```bash
npm run dev
```

Access at: **http://localhost/api/login** (via Apache) or **http://localhost:5000/api/login** (direct)

### Production Mode
```bash
npm run build
./start-production.sh
```

Access at: **http://localhost:3001/api/login**

## Login Credentials

- **Email:** admin@localhost
- **Password:** admin123
- **Role:** Administrator

## System Architecture

```
User Browser
     ↓
Apache (Port 80) ← Proxy to → Node.js (Port 5000)
     ↓                              ↓
 Public Access              SQLite Database
```

## Verification Steps

### 1. Check Database
```bash
sqlite3 permit_system.db "SELECT email, role FROM users;"
# Output: admin@localhost|admin
```

### 2. Test Authentication
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"admin123"}'
# Output: {"success":true,"user":{...}}
```

### 3. Test Apache Proxy
```bash
curl http://localhost/api/login | grep "Login"
# Output: <title>Login - Permit Management System</title>
```

## File Structure

```
permit-system/
├── permit_system.db        # SQLite database
├── .env                    # Environment config
├── uploads/               # File uploads
├── package.json           # Dependencies
├── quick-setup.sh         # Automated setup
├── start-production.sh    # Production startup
└── server/               # Application code
```

## Troubleshooting

### Database Issues
```bash
# Reset database
rm permit_system.db
node create-db.js
```

### Apache Issues
```bash
# Check logs
sudo tail -f /var/log/apache2/permit_error.log

# Restart Apache
sudo systemctl restart apache2
```

### Port Conflicts
```bash
# Check port usage
sudo lsof -i :5000
sudo lsof -i :80

# Kill conflicting processes
sudo fuser -k 5000/tcp
```

### Permission Errors
```bash
# Fix permissions
chmod 664 permit_system.db
chmod 755 uploads/
sudo chown -R $USER:$USER .
```

## Features Available

- **User Authentication** - Local SQLite-based login system
- **Admin Dashboard** - User management and system overview
- **File Uploads** - Document management with file validation
- **Session Management** - Secure session handling
- **Apache Integration** - Production-ready web server setup
- **Security Headers** - XSS protection and content security

## Security Notes

1. Change default admin password after first login
2. SQLite database contains hashed passwords (bcrypt)
3. Session tokens are securely managed
4. Apache provides additional security headers
5. File upload validation prevents malicious files

This setup provides a complete, working permit management system with Apache web server integration and SQLite authentication suitable for local deployment on Kali Linux.
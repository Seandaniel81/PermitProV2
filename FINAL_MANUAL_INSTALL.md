# Complete Manual Installation Guide - Permit Management System

## System Requirements
- Kali Linux or Debian-based system
- Node.js 18+ 
- Apache2 web server
- SQLite3
- Git

## Step 1: Install System Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nodejs npm sqlite3 apache2 git curl build-essential

# Verify installations
node --version
npm --version
sqlite3 --version
apache2 -v
```

## Step 2: Download and Setup Project

```bash
# Clone or download the project (replace with your method)
# cd /path/to/permit-system

# Install Node.js dependencies
npm install

# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

## Step 3: Configure Environment

```bash
# Create development environment file
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

# Create production environment file
cat > .env.production << 'EOF'
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=a4f7c8e2b9d1e6f3a8c5b2e9f1d4a7c0b6e8f2a5c9d1e7f4a8b2e5c9f1d6a3c8
FORCE_LOCAL_AUTH=true
USE_DEV_AUTH=true
NODE_ENV=production
PORT=3001
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF
```

## Step 4: Setup SQLite Database

```bash
# Create database setup script
cat > setup-database.js << 'EOF'
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

async function setupDatabase() {
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
    
    console.log('✅ Database setup completed');
    console.log('✅ Admin user created: admin@localhost / admin123');
    
    db.close();
}

setupDatabase().catch(console.error);
EOF

# Run database setup
node setup-database.js

# Clean up setup script
rm setup-database.js

# Verify database was created
ls -la permit_system.db
```

## Step 5: Configure Apache2

```bash
# Enable required Apache modules
sudo a2enmod proxy proxy_http ssl rewrite headers

# Create virtual host configuration
sudo tee /etc/apache2/sites-available/permit-system.conf << 'EOF'
<VirtualHost *:80>
    ServerName localhost
    ServerAlias permit.local
    DocumentRoot /var/www/html

    # Proxy configuration for Node.js backend
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/

    # Timeout settings
    ProxyTimeout 300
    ProxyBadHeader Ignore

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/permit_error.log
    CustomLog ${APACHE_LOG_DIR}/permit_access.log combined
    LogLevel warn

    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"

    # Performance optimizations
    Header unset ETag
    FileETag None
</VirtualHost>
EOF

# Enable the site and disable default
sudo a2ensite permit-system.conf
sudo a2dissite 000-default.conf

# Test Apache configuration
sudo apache2ctl configtest

# If test passes, reload Apache
sudo systemctl reload apache2

# Verify Apache is running
sudo systemctl status apache2
```

## Step 6: Create Startup Scripts

### Development Mode Script
```bash
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "Starting Permit Management System (Development Mode)"
echo "Admin credentials: admin@localhost / admin123"
echo "Access via: http://localhost/api/login"
echo ""
npm run dev
EOF

chmod +x start-dev.sh
```

### Production Mode Script
```bash
cat > start-prod.sh << 'EOF'
#!/bin/bash
echo "Starting Permit Management System (Production Mode)"

# Ensure database exists
if [ ! -f "permit_system.db" ]; then
    echo "Database not found, please run development setup first"
    exit 1
fi

# Set production environment
export NODE_ENV=production
export DATABASE_URL=file:./permit_system.db
export FORCE_LOCAL_AUTH=true
export PORT=3001

# Clear PostgreSQL variables
unset PGDATABASE PGUSER PGPASSWORD PGHOST PGPORT

echo "Admin credentials: admin@localhost / admin123"
echo "Access via: http://localhost:3001/api/login"
echo ""

# Build and start
npm run build
node dist/index.js
EOF

chmod +x start-prod.sh
```

## Step 7: Test Installation

### Test 1: Database Verification
```bash
# Check database contents
sqlite3 permit_system.db "SELECT id, email, role FROM users;"

# Should show: admin|admin@localhost|admin
```

### Test 2: Development Mode
```bash
# Start development server
./start-dev.sh

# In another terminal, test login endpoint
curl http://localhost:5000/api/login | head -10

# Should return HTML login page
```

### Test 3: Authentication Test
```bash
# Test login (with development server running)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"admin123"}'

# Should return: {"success":true,"user":{...}}
```

### Test 4: Apache Proxy Test
```bash
# Test Apache proxy (with development server running)
curl http://localhost/api/login | head -10

# Should return same HTML login page
```

## Step 8: Access the System

1. **Start the application:**
   ```bash
   ./start-dev.sh
   ```

2. **Open web browser and go to:**
   ```
   http://localhost/api/login
   ```

3. **Login with admin credentials:**
   - Email: `admin@localhost`
   - Password: `admin123`

## Troubleshooting

### Database Issues
```bash
# Reset database
rm permit_system.db
node setup-database.js
```

### Apache Issues
```bash
# Check Apache error logs
sudo tail -f /var/log/apache2/permit_error.log

# Check if Apache is listening on port 80
sudo netstat -tlnp | grep :80

# Restart Apache
sudo systemctl restart apache2
```

### Port Conflicts
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill process if needed
sudo fuser -k 5000/tcp
```

### Permission Issues
```bash
# Fix file permissions
chmod 664 permit_system.db
chmod 755 uploads/
chmod +x *.sh
```

## File Structure After Installation

```
permit-system/
├── permit_system.db          # SQLite database
├── .env                      # Development environment
├── .env.production          # Production environment
├── uploads/                 # File upload directory
├── start-dev.sh            # Development startup script
├── start-prod.sh           # Production startup script
├── package.json            # Node.js dependencies
├── dist/                   # Production build (after npm run build)
└── server/                 # Source code
```

## Default Credentials

- **Email:** admin@localhost
- **Password:** admin123
- **Role:** Administrator

## Security Notes

1. Change the default admin password after first login
2. The SESSION_SECRET should be unique for production
3. SQLite database file should have appropriate permissions
4. Consider firewall rules for production deployment

This manual installation provides a complete working permit management system with Apache2 web server and SQLite authentication for Kali Linux.
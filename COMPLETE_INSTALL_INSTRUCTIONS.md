# Complete Installation Instructions - Permit Management System

## Quick Start (Recommended)

### 1. Download and Run Setup Script
```bash
# Make setup script executable and run
chmod +x setup-complete.sh
./setup-complete.sh
```

### 2. Choose SQLite Mode (Option 1)
- Select "1" for Local SQLite Authentication
- Choose "y" to install dependencies
- Choose "y" to configure Apache2 (optional)

### 3. Start Application
```bash
npm run dev
```

### 4. Access System
- Open browser to http://localhost:5000/api/login
- Login with: admin@localhost / admin123

## Manual Installation (Alternative)

### Step 1: Install Dependencies
```bash
# Kali Linux / Ubuntu / Debian
sudo apt update
sudo apt install nodejs npm sqlite3 apache2 git curl build-essential

# Install project dependencies
npm install
```

### Step 2: Configure Environment
```bash
# Create environment file
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=file:./permit_system.db

# Authentication Configuration
SESSION_SECRET=your-32-character-secret-key-here
FORCE_LOCAL_AUTH=true
USE_DEV_AUTH=true

# Application Settings
NODE_ENV=development
PORT=5000

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF
```

### Step 3: Create SQLite Database
```bash
# Create database file
touch permit_system.db

# Create setup script
cat > create-admin.js << 'EOF'
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

async function setup() {
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
    
    // Create sessions table
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
    
    try {
        db.prepare(`
            INSERT OR REPLACE INTO users (
                id, email, password_hash, first_name, last_name, 
                role, is_active, approval_status, approved_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
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
        
        console.log('Admin user created: admin@localhost / admin123');
    } catch (error) {
        console.log('Admin user already exists or error:', error.message);
    }
    
    db.close();
}

setup().catch(console.error);
EOF

# Run setup
node create-admin.js
rm create-admin.js
```

### Step 4: Create Upload Directory
```bash
mkdir -p uploads
chmod 755 uploads
```

### Step 5: Start Application
```bash
npm run dev
```

## Apache2 Web Server Configuration

The permit management system is designed to run with Apache2 as the web server, which proxies requests to the Node.js backend.

### Install and Configure Apache2
```bash
# Install Apache2
sudo apt update
sudo apt install apache2

# Enable required modules
sudo a2enmod proxy proxy_http ssl rewrite headers

# Create virtual host configuration
sudo tee /etc/apache2/sites-available/permit-system.conf << 'EOF'
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html

    # Proxy all requests to Node.js application
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/

    # Enable logging
    ErrorLog ${APACHE_LOG_DIR}/permit_error.log
    CustomLog ${APACHE_LOG_DIR}/permit_access.log combined

    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
EOF

# Enable the site and disable default
sudo a2ensite permit-system.conf
sudo a2dissite 000-default.conf

# Test and reload Apache
sudo apache2ctl configtest
sudo systemctl reload apache2
```

### Start Both Services
```bash
# Start Node.js application
npm run dev

# Apache automatically starts with system
# Access via: http://localhost/api/login
```

## Testing the Installation

### 1. Check Service Status
```bash
# Check if application is running
curl http://localhost:5000/api/login

# Should return HTML login page
```

### 2. Test Login
```bash
# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"admin123"}'

# Should return: {"success":true,"user":{...}}
```

### 3. Access Dashboard
```bash
# Open in browser (via Apache)
firefox http://localhost/api/login
# OR
chromium http://localhost/api/login
```

## Default Credentials

**Admin Account:**
- Email: admin@localhost
- Password: admin123
- Role: Administrator

## File Locations

- **Database:** `./permit_system.db`
- **Configuration:** `./.env`
- **Uploads:** `./uploads/`
- **Logs:** Console output
- **Apache Logs:** `/var/log/apache2/permit_*.log`

## Troubleshooting

### Issue: Authentication Not Working
```bash
# Check database
sqlite3 permit_system.db "SELECT * FROM users;"

# Check environment
cat .env | grep FORCE_LOCAL_AUTH

# Should show: FORCE_LOCAL_AUTH=true
```

### Issue: Database Errors
```bash
# Reset database
rm permit_system.db
node create-admin.js
```

### Issue: Port Already in Use
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill the process
sudo fuser -k 5000/tcp
```

### Issue: Permission Errors
```bash
# Fix permissions
chmod 664 permit_system.db
chmod 755 uploads
```

## Production Deployment

### For OIDC Authentication
1. Set up Auth0 or Google OAuth credentials
2. Configure PostgreSQL database
3. Update environment variables
4. Set `FORCE_LOCAL_AUTH=false`
5. Use `npm run build && npm start`

### Security Considerations
- Change default admin password immediately
- Use strong SESSION_SECRET (32+ characters)
- Enable HTTPS in production
- Configure firewall rules
- Regular database backups

## Support Commands

```bash
# View application logs
npm run dev

# Check database content
sqlite3 permit_system.db ".tables"
sqlite3 permit_system.db "SELECT * FROM users;"

# Reset everything
rm -f permit_system.db .env
./setup-complete.sh

# Check Apache status
sudo systemctl status apache2
sudo tail -f /var/log/apache2/permit_error.log
```

This installation provides a complete working permit management system with SQLite authentication suitable for private/development use on Kali Linux or any Debian-based system.
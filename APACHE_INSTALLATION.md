# Apache Installation Guide - Permit Management System

## Complete Apache Setup for Kali Linux

This guide configures the permit management system to run with Apache2 as the web server, providing a production-ready setup for Kali Linux.

### Quick Installation

```bash
# Run the automated setup script
chmod +x quick-setup.sh
sudo ./quick-setup.sh
```

### Manual Apache Configuration

#### 1. Install Apache2 and Dependencies

```bash
# Update system
sudo apt update

# Install required packages
sudo apt install apache2 nodejs npm sqlite3 git curl build-essential

# Start and enable Apache
sudo systemctl start apache2
sudo systemctl enable apache2
```

#### 2. Configure Apache Modules

```bash
# Enable required Apache modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod rewrite
sudo a2enmod headers

# Verify modules are enabled
apache2ctl -M | grep -E "(proxy|ssl|rewrite|headers)"
```

#### 3. Create Virtual Host Configuration

```bash
# Create permit system virtual host
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
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # Performance optimizations
    Header unset ETag
    FileETag None
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/ico "access plus 1 month"
</VirtualHost>
EOF
```

#### 4. Enable Site and Configure

```bash
# Enable the permit system site
sudo a2ensite permit-system.conf

# Disable default Apache site to avoid conflicts
sudo a2dissite 000-default.conf

# Test Apache configuration
sudo apache2ctl configtest

# If configuration test passes, reload Apache
sudo systemctl reload apache2
```

#### 5. Setup Application

```bash
# Navigate to your project directory
cd /path/to/permit-system

# Install Node.js dependencies
npm install

# Create environment configuration
cat > .env << 'EOF'
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=your-generated-32-character-session-secret
FORCE_LOCAL_AUTH=true
USE_DEV_AUTH=true
NODE_ENV=development
PORT=5000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Setup SQLite database with admin user
cat > setup-db.js << 'EOF'
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
    `);
    
    db.exec(`
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
    
    console.log('Database setup completed - Admin: admin@localhost / admin123');
    db.close();
}

setup().catch(console.error);
EOF

node setup-db.js
rm setup-db.js
```

### Starting the System

#### 1. Start Node.js Application

```bash
# Start the backend application
npm run dev

# Application will run on port 5000
```

#### 2. Verify Apache Status

```bash
# Check Apache status
sudo systemctl status apache2

# Check if port 80 is listening
sudo netstat -tlnp | grep :80

# Test Apache proxy
curl -I http://localhost/
```

### Access the Application

- **URL:** http://localhost/api/login
- **Admin Email:** admin@localhost
- **Admin Password:** admin123

### Firewall Configuration (Optional)

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# Allow HTTPS traffic (for future SSL setup)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Troubleshooting

#### Check Apache Logs

```bash
# View error logs
sudo tail -f /var/log/apache2/permit_error.log

# View access logs
sudo tail -f /var/log/apache2/permit_access.log

# Check Apache error log for startup issues
sudo journalctl -u apache2.service
```

#### Common Issues

**1. Apache won't start:**
```bash
# Check configuration syntax
sudo apache2ctl configtest

# Check if another service is using port 80
sudo lsof -i :80
```

**2. Proxy not working:**
```bash
# Verify Node.js is running on port 5000
curl http://localhost:5000/api/login

# Check proxy modules are enabled
apache2ctl -M | grep proxy
```

**3. Permission issues:**
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/
sudo chmod -R 755 /var/www/
```

#### Service Management

```bash
# Restart Apache
sudo systemctl restart apache2

# Restart Node.js application
# Stop with Ctrl+C and run: npm run dev

# Check service status
sudo systemctl status apache2

# Enable Apache to start on boot
sudo systemctl enable apache2
```

### Production Deployment

For production use:

1. **Enable SSL/HTTPS:**
```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d yourdomain.com
```

2. **Update environment:**
```bash
# Set NODE_ENV=production in .env
# Use PostgreSQL instead of SQLite for better performance
```

3. **Process management:**
```bash
# Use PM2 for Node.js process management
npm install -g pm2
pm2 start "npm run dev" --name permit-system
pm2 startup
pm2 save
```

This Apache configuration provides a robust web server setup for the permit management system with proper proxying, logging, and security headers.
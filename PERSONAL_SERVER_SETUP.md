# Personal Server Installation Guide

Complete setup guide for running the Permit Management System on your personal server with PostgreSQL, Apache, and Bun.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / RHEL 8+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Internet connection for initial setup

### Required Software
- PostgreSQL 13+
- Apache 2.4+
- Bun (JavaScript runtime)
- Git
- Curl/Wget

## Part 1: System Preparation

### Step 1: Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
# or for newer versions
sudo dnf update -y
```

### Step 2: Install Essential Tools
```bash
# Ubuntu/Debian
sudo apt install -y curl wget git unzip build-essential

# CentOS/RHEL
sudo yum install -y curl wget git unzip gcc gcc-c++ make
```

## Part 2: PostgreSQL Installation & Configuration

### Step 1: Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

### Step 2: Start and Enable PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 3: Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL shell, create database and user
CREATE USER permit_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE permit_system OWNER permit_user;
GRANT ALL PRIVILEGES ON DATABASE permit_system TO permit_user;
\q
```

### Step 4: Configure PostgreSQL Authentication
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add this line for local connections (replace XX with your version)
local   permit_system   permit_user                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 5: Test Database Connection
```bash
psql -h localhost -U permit_user -d permit_system
# Enter password when prompted
# If successful, type \q to exit
```

## Part 3: Apache Installation & Configuration

### Step 1: Install Apache
```bash
# Ubuntu/Debian
sudo apt install -y apache2

# CentOS/RHEL
sudo yum install -y httpd
```

### Step 2: Enable Required Modules
```bash
# Ubuntu/Debian
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod ssl

# CentOS/RHEL
# Modules are typically enabled by default
```

### Step 3: Create Virtual Host Configuration
```bash
sudo nano /etc/apache2/sites-available/permit-system.conf
```

Add this configuration:
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/permit-system/dist/public
    
    # Proxy API requests to Bun server
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/
    ProxyPass /auth/ http://localhost:3000/auth/
    ProxyPassReverse /auth/ http://localhost:3000/auth/
    
    # Serve static files directly
    <Directory "/var/www/permit-system/dist/public">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Single Page Application fallback
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/permit-system_error.log
    CustomLog ${APACHE_LOG_DIR}/permit-system_access.log combined
</VirtualHost>

# HTTPS Configuration (after SSL certificate setup)
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/permit-system/dist/public
    
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/your-domain.crt
    SSLCertificateKeyFile /etc/ssl/private/your-domain.key
    
    # Same proxy and directory configuration as above
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/
    ProxyPass /auth/ http://localhost:3000/auth/
    ProxyPassReverse /auth/ http://localhost:3000/auth/
    
    <Directory "/var/www/permit-system/dist/public">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    
    ErrorLog ${APACHE_LOG_DIR}/permit-system_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/permit-system_ssl_access.log combined
</VirtualHost>
```

### Step 4: Enable Site and Restart Apache
```bash
# Ubuntu/Debian
sudo a2ensite permit-system.conf
sudo systemctl restart apache2

# CentOS/RHEL
# Copy config to /etc/httpd/conf.d/permit-system.conf instead
sudo systemctl restart httpd
```

## Part 4: Bun Installation

### Step 1: Install Bun
```bash
curl -fsSL https://bun.sh/install | bash

# Add to PATH
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
bun --version
```

## Part 5: Application Deployment

### Step 1: Create Application Directory
```bash
sudo mkdir -p /var/www/permit-system
sudo chown $USER:$USER /var/www/permit-system
cd /var/www/permit-system
```

### Step 2: Clone and Setup Application
```bash
# Clone your repository (replace with your actual repo)
git clone https://github.com/your-username/permit-system.git .

# Or upload your files manually to this directory

# Install dependencies
bun install
```

### Step 3: Create Environment Configuration
```bash
nano .env.production
```

Add this configuration:
```env
# Database Configuration
DATABASE_URL=postgresql://permit_user:your_secure_password_here@localhost:5432/permit_system

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Session Security
SESSION_SECRET=your_super_secure_session_secret_change_this

# GitHub OAuth (Optional - leave blank to disable)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback

# File Upload Configuration
UPLOAD_DIR=/var/www/permit-system/uploads
MAX_FILE_SIZE=10485760

# Email Configuration (Optional)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-email-password
```

### Step 4: Build Application
```bash
bun run build
```

### Step 5: Setup Database Schema
```bash
# Run database migrations
bun run db:push

# Create admin user (run this script)
cat > setup-admin.js << 'EOF'
import { storage } from './server/storage.js';
import bcrypt from 'bcrypt';

async function setupAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await storage.upsertUser({
      id: 'admin',
      email: 'admin@localhost',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true,
      approvalStatus: 'approved',
    });
    
    console.log('Admin user created successfully');
    console.log('Email: admin@localhost');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupAdmin();
EOF

bun setup-admin.js
rm setup-admin.js
```

### Step 6: Create Upload Directory
```bash
mkdir -p uploads
chmod 755 uploads
```

## Part 6: Process Management

### Step 1: Create Systemd Service
```bash
sudo nano /etc/systemd/system/permit-system.service
```

Add this configuration:
```ini
[Unit]
Description=Permit Management System
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/permit-system
Environment=NODE_ENV=production
EnvironmentFile=/var/www/permit-system/.env.production
ExecStart=/home/your-username/.bun/bin/bun dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=permit-system

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/www/permit-system/uploads

[Install]
WantedBy=multi-user.target
```

### Step 2: Set Permissions and Start Service
```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/permit-system

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable permit-system
sudo systemctl start permit-system

# Check status
sudo systemctl status permit-system
```

## Part 7: SSL Certificate Setup (Optional but Recommended)

### Using Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-apache

# Obtain certificate
sudo certbot --apache -d your-domain.com

# Auto-renewal (check if cron job exists)
sudo crontab -l | grep certbot || echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Using Self-Signed Certificate (Development)
```bash
# Create self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/permit-system.key \
  -out /etc/ssl/certs/permit-system.crt

# Update Apache config to use these certificates
```

## Part 8: GitHub OAuth Setup (Optional)

### Step 1: Create GitHub App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Your Permit System
   - **Homepage URL**: https://your-domain.com
   - **Authorization callback URL**: https://your-domain.com/auth/github/callback
4. Note the Client ID and Client Secret

### Step 2: Update Environment Variables
```bash
nano .env.production

# Add GitHub OAuth credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback
```

### Step 3: Restart Service
```bash
sudo systemctl restart permit-system
```

## Part 9: Firewall Configuration

### UFW (Ubuntu/Debian)
```bash
sudo ufw allow 22        # SSH
sudo ufw allow 80        # HTTP
sudo ufw allow 443       # HTTPS
sudo ufw allow 5432      # PostgreSQL (local only)
sudo ufw --force enable
```

### Firewalld (CentOS/RHEL)
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

## Part 10: Monitoring & Maintenance

### Log Monitoring
```bash
# Application logs
sudo journalctl -u permit-system -f

# Apache logs
sudo tail -f /var/log/apache2/permit-system_error.log
sudo tail -f /var/log/apache2/permit-system_access.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Database Backup Script
```bash
cat > /home/$USER/backup-permit-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -h localhost -U permit_user permit_system > $BACKUP_DIR/permit_system_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "permit_system_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/permit_system_$DATE.sql"
EOF

chmod +x /home/$USER/backup-permit-db.sh

# Add to crontab for daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/backup-permit-db.sh") | crontab -
```

### Update Script
```bash
cat > /home/$USER/update-permit-system.sh << 'EOF'
#!/bin/bash
cd /var/www/permit-system

# Backup current version
sudo cp -r . /home/$USER/permit-system-backup-$(date +%Y%m%d)

# Pull updates
git pull origin main

# Install dependencies
bun install

# Build application
bun run build

# Run migrations
bun run db:push

# Restart service
sudo systemctl restart permit-system

echo "Update completed successfully"
EOF

chmod +x /home/$USER/update-permit-system.sh
```

## Part 11: Access & Initial Setup

### Access Your System
1. **Local Access**: http://localhost (or your server IP)
2. **Domain Access**: http://your-domain.com
3. **HTTPS**: https://your-domain.com (after SSL setup)

### Default Login
- **Email**: admin@localhost
- **Password**: admin123

### First Steps After Login
1. **Change admin password** in User Management
2. **Configure system settings** in Settings panel
3. **Create additional users** via Admin panel
4. **Test file upload** functionality
5. **Create sample permit package** to verify everything works

## Troubleshooting

### Common Issues

**Service won't start:**
```bash
sudo journalctl -u permit-system --no-pager -n 50
```

**Database connection failed:**
```bash
psql -h localhost -U permit_user permit_system
```

**Apache proxy not working:**
```bash
sudo apache2ctl configtest
sudo systemctl restart apache2
```

**Permission errors:**
```bash
sudo chown -R www-data:www-data /var/www/permit-system
sudo chmod -R 755 /var/www/permit-system
sudo chmod -R 775 /var/www/permit-system/uploads
```

### Performance Optimization

**PostgreSQL tuning:**
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf

# Add these settings (adjust based on your RAM)
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
```

**Apache tuning:**
```bash
sudo nano /etc/apache2/mods-available/mpm_prefork.conf

# Adjust based on your server resources
<IfModule mpm_prefork_module>
    StartServers 8
    MinSpareServers 5
    MaxSpareServers 20
    ServerLimit 256
    MaxRequestWorkers 256
    MaxConnectionsPerChild 10000
</IfModule>
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Enabled firewall with minimal open ports
- [ ] SSL certificate installed and configured
- [ ] Regular security updates scheduled
- [ ] Database backup script configured
- [ ] Strong session secret configured
- [ ] File upload restrictions in place
- [ ] Server logs monitored
- [ ] GitHub OAuth configured (if using)
- [ ] User approval workflow configured

## Support

For technical issues:
1. Check application logs: `sudo journalctl -u permit-system`
2. Check Apache logs: `/var/log/apache2/permit-system_error.log`
3. Verify database connectivity
4. Review firewall settings
5. Check file permissions

Your Permit Management System is now ready for production use on your personal server!
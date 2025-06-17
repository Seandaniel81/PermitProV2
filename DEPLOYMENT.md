# Production Deployment Guide

## Prerequisites

- Bun runtime (or Node.js 18+)
- PostgreSQL 12+
- PM2 (recommended for production)
- Nginx or Apache (for reverse proxy)

## Quick Deployment

### 1. Automated Installation

```bash
# Make installation script executable
chmod +x install.sh

# Run installation
./install.sh
```

### 2. Manual Configuration

After installation, edit `.env` file with your production settings:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/permits_db

# Authentication (automatically generated secure secret)
SESSION_SECRET=64-character-hex-string-generated-automatically
REPL_ID=standalone
REPLIT_DOMAINS=yourdomain.com

# Application Settings
NODE_ENV=production
PORT=5000
```

### 3. Start Production Server

```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Or using bun
bun start
```

## Configuration Validation

The application includes comprehensive configuration validation:

- **Session Secret**: Automatically generated 64-character secure secret
- **Database URL**: Validated PostgreSQL connection string
- **Port Configuration**: Configurable via PORT environment variable
- **File Upload**: Configurable upload directory and size limits

## Apache2 Configuration

### Virtual Host Configuration

Create a virtual host file at `/etc/apache2/sites-available/permit-management.conf`:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    SSLCertificateChainFile /path/to/your/chain.crt
    
    # Security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    # Enable mod_proxy and mod_proxy_http
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Proxy to Bun/Node.js application
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    # WebSocket support
    ProxyPass /ws/ ws://localhost:5000/ws/
    ProxyPassReverse /ws/ ws://localhost:5000/ws/
    
    # Static file caching
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </LocationMatch>
    
    # File upload size limit
    LimitRequestBody 52428800
    
    # Error and access logs
    ErrorLog ${APACHE_LOG_DIR}/permit-management-error.log
    CustomLog ${APACHE_LOG_DIR}/permit-management-access.log combined
</VirtualHost>
```

### Required Apache2 Modules

Enable the necessary Apache2 modules:

```bash
# Enable required modules
sudo a2enmod ssl
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod headers
sudo a2enmod expires

# Enable the site
sudo a2ensite permit-management.conf

# Test configuration
sudo apache2ctl configtest

# Restart Apache2
sudo systemctl restart apache2
```

## Nginx Configuration (Alternative)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static file optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:5000;
    }
}
```

## Database Backup Strategy

### Automated Backups

The application includes built-in backup functionality:

```bash
# Run backup script
bun run scripts/backup-database.js

# Restore from backup
bun run scripts/restore-database.js backup_filename.sql
```

### Manual PostgreSQL Backup

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_file.sql
```

## Security Checklist

- [ ] Strong database passwords
- [ ] Secure session secret (64+ characters)
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured
- [ ] Regular security updates
- [ ] File upload restrictions in place
- [ ] Database connection encryption enabled

## Performance Optimization

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'permit-management-system',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_packages_status ON permit_packages(status);
CREATE INDEX idx_packages_created_by ON permit_packages(created_by);
CREATE INDEX idx_documents_package_id ON package_documents(package_id);
CREATE INDEX idx_documents_completed ON package_documents(is_completed);
```

## Monitoring and Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# View process status
pm2 status
```

### Log Files

- Application logs: `logs/combined.log`
- Error logs: `logs/err.log`
- Access logs: Available through PM2 or nginx

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in .env file
   PORT=5001
   ```

2. **Database connection failed**
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT version();"
   ```

3. **Permission denied on file uploads**
   ```bash
   # Fix directory permissions
   chmod 755 uploads logs backups
   ```

4. **Session secret validation failed**
   ```bash
   # Generate new secret
   openssl rand -hex 32
   ```

### Health Checks

```bash
# Application health check
curl -I http://localhost:5000

# Database health check
curl http://localhost:5000/api/health
```

## Scaling Considerations

- Use PM2 cluster mode for multi-core utilization
- Implement Redis for session storage in multi-instance deployments
- Configure load balancer for high availability
- Set up database read replicas for improved performance
- Implement CDN for static assets

## Maintenance

### Regular Tasks

- Monitor disk space for uploads and logs
- Review and rotate log files
- Update dependencies regularly
- Backup database regularly
- Monitor application performance

### Updates

```bash
# Update dependencies
bun update

# Rebuild application
bun run build

# Restart PM2 processes
pm2 restart all
```
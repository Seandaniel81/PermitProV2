# Direct Setup Commands for Kali Linux

Run these commands in your terminal to set up the permit management system:

## 1. Environment Setup

```bash
# Navigate to your project directory
cd ~/Downloads/PermitProV2

# Generate session secret and create .env file
SESSION_SECRET=$(openssl rand -hex 32)
cat > .env << EOF
DATABASE_URL=file:./permit_system.db
SESSION_SECRET=${SESSION_SECRET}
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
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Database Setup

```bash
# Run the database setup script
node setup-database-standalone.js
```

## 4. Test Authentication

```bash
# Start the application in one terminal
npm run dev

# In another terminal, test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"admin123"}'
```

## 5. Apache Configuration

```bash
# Enable Apache modules
sudo a2enmod proxy proxy_http ssl rewrite headers

# Create virtual host
sudo tee /etc/apache2/sites-available/permit-system.conf > /dev/null << 'EOF'
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    ErrorLog ${APACHE_LOG_DIR}/permit_error.log
    CustomLog ${APACHE_LOG_DIR}/permit_access.log combined
    
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
EOF

# Enable site
sudo a2ensite permit-system.conf
sudo a2dissite 000-default.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## 6. Final Verification

```bash
# Run verification script
chmod +x verify-installation.sh
./verify-installation.sh
```

## Access Information

- **Login URL**: http://localhost/api/login
- **Credentials**: admin@localhost / admin123
- **Direct Access**: http://localhost:5000/api/login

Your system will be fully operational after running these commands.
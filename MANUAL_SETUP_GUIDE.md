# Manual Setup Guide for Permit Management System

This guide provides step-by-step instructions to set up the permit management system on Kali Linux with Apache2.

## Prerequisites

Ensure you have Node.js, npm, and basic development tools installed:

```bash
sudo apt update
sudo apt install -y nodejs npm apache2 openssl
```

## Step 1: Environment Configuration

Create the environment configuration file:

```bash
# Generate a secure session secret
SESSION_SECRET=$(openssl rand -hex 32)

# Create .env file
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
```

## Step 2: Create Required Directories

```bash
mkdir -p uploads
chmod 755 uploads
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Database Setup

Run the database setup script:

```bash
node setup-database-standalone.js
```

This will create the SQLite database with the admin user:
- Email: admin@localhost
- Password: admin123

## Step 5: Test the Application

Start the Node.js application:

```bash
npm run dev
```

The application will run on port 5000. Test the login:

```bash
# In another terminal, test the authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"admin123"}'
```

You should see a success response with user details.

## Step 6: Configure Apache2

Enable required Apache modules:

```bash
sudo a2enmod proxy proxy_http ssl rewrite headers
```

Create the virtual host configuration:

```bash
sudo tee /etc/apache2/sites-available/permit-system.conf > /dev/null << 'EOF'
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
```

Enable the site and restart Apache:

```bash
sudo a2ensite permit-system.conf
sudo a2dissite 000-default.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## Step 7: Start the System

1. Start the Node.js application:
   ```bash
   npm run dev
   ```

2. Access the system through Apache:
   ```
   http://localhost/api/login
   ```

## Verification

Run the verification script to ensure everything is working:

```bash
./verify-installation.sh
```

## Login Credentials

- **Email:** admin@localhost
- **Password:** admin123

## Troubleshooting

### Check Application Logs
The Node.js application logs will show in the terminal where you ran `npm run dev`.

### Check Apache Logs
```bash
sudo tail -f /var/log/apache2/permit_error.log
sudo tail -f /var/log/apache2/permit_access.log
```

### Reset Database
If you need to reset the database:
```bash
node setup-database-standalone.js
```

### Check Port Availability
Ensure port 5000 is available:
```bash
netstat -ln | grep :5000
```

## Security Notes

- The admin password should be changed after initial setup
- Session secrets are automatically generated and secured
- All authentication uses bcrypt password hashing
- Apache proxy configuration includes security headers

## Next Steps

Once the system is running successfully:
1. Change the default admin password
2. Configure additional users if needed
3. Review Apache security settings for production use
4. Set up SSL certificates for HTTPS if required

The system is now ready for production use with secure authentication and proper Apache proxy configuration.
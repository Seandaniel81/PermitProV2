# Permit Management System - Complete Installation Guide

## Overview
This permit management system supports two authentication modes:
- **Local SQLite Authentication** - For private/offline installations
- **OIDC Authentication** - For production deployments with Auth0/Google OAuth

## Prerequisites

### System Requirements
- Node.js 18+ or Bun runtime
- Apache2 web server (optional for production)
- Git
- SQLite3 (for local mode) or PostgreSQL (for production)

### For Kali Linux
```bash
sudo apt update
sudo apt install nodejs npm sqlite3 apache2 git curl
```

## Installation Methods

### Method 1: Quick Install Script (Recommended)

1. **Download and run the installation script:**
```bash
curl -sSL https://raw.githubusercontent.com/your-repo/permit-system/main/install.sh | bash
```

2. **Follow the interactive prompts:**
   - Choose authentication mode (Local SQLite or OIDC)
   - Configure database settings
   - Set up admin credentials

### Method 2: Manual Installation

#### Step 1: Clone and Setup Project
```bash
# Clone the repository
git clone https://github.com/your-repo/permit-system.git
cd permit-system

# Install dependencies
npm install
# OR if using Bun
bun install
```

#### Step 2: Choose Authentication Mode

##### Option A: Local SQLite Authentication (Private/Offline)

1. **Create environment configuration:**
```bash
cp .env.example .env
```

2. **Edit `.env` file:**
```bash
# Database Configuration
DATABASE_URL=file:./permit_system.db

# Authentication Configuration
SESSION_SECRET=your-super-secure-session-secret-here
FORCE_LOCAL_AUTH=true
USE_DEV_AUTH=true

# Application Settings
NODE_ENV=development
PORT=5000

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

3. **Create SQLite database and admin user:**
```bash
# Create database file
touch permit_system.db

# Run the setup script
node scripts/setup-database.js
```

4. **Default admin credentials:**
   - Email: `admin@localhost`
   - Password: `admin123`

##### Option B: OIDC Authentication (Production)

1. **Set up Auth0 or Google OAuth:**

   **For Auth0:**
   - Create Auth0 account at https://auth0.com
   - Create new application (Single Page Application)
   - Note your Domain, Client ID, and Client Secret

   **For Google OAuth:**
   - Go to Google Cloud Console
   - Create new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Note your Client ID and Client Secret

2. **Configure environment:**
```bash
# Database Configuration (PostgreSQL for production)
DATABASE_URL=postgresql://username:password@localhost:5432/permit_db

# Authentication - OIDC Configuration
SESSION_SECRET=your-super-secure-session-secret-here
OIDC_ISSUER_URL=https://your-domain.auth0.com
# OR for Google: https://accounts.google.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
ALLOWED_DOMAINS=yourdomain.com,localhost:5000
AUTO_APPROVE_USERS=false
FORCE_LOCAL_AUTH=false
USE_DEV_AUTH=false

# Application Settings
NODE_ENV=production
PORT=3001

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

#### Step 3: Database Setup

##### For SQLite (Local)
```bash
# Database is automatically created
# Admin user is created with default credentials
npm run db:push
```

##### For PostgreSQL (Production)
```bash
# Create database
createdb permit_db

# Run migrations
npm run db:push

# Seed initial data
npm run seed
```

#### Step 4: Start the Application

##### Development Mode
```bash
npm run dev
# OR
bun run dev
```

##### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start
# OR
bun start
```

## Apache2 Configuration (Optional)

### For Development (Port 5000)
```bash
sudo a2enmod proxy proxy_http ssl rewrite

# Create virtual host
sudo tee /etc/apache2/sites-available/permit-dev.conf << EOF
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html

    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/

    ErrorLog \${APACHE_LOG_DIR}/permit-dev_error.log
    CustomLog \${APACHE_LOG_DIR}/permit-dev_access.log combined
</VirtualHost>
EOF

sudo a2ensite permit-dev
sudo systemctl reload apache2
```

### For Production (Port 3001)
```bash
# Create production virtual host
sudo tee /etc/apache2/sites-available/permit-prod.conf << EOF
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html

    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/

    ErrorLog \${APACHE_LOG_DIR}/permit-prod_error.log
    CustomLog \${APACHE_LOG_DIR}/permit-prod_access.log combined
</VirtualHost>
EOF

sudo a2ensite permit-prod
sudo systemctl reload apache2
```

## Configuration Details

### Authentication Modes

#### Local SQLite Mode
- **Best for:** Private installations, development, offline use
- **Database:** SQLite file-based database
- **Users:** Local user management with bcrypt password hashing
- **Sessions:** Memory-based session storage
- **Security:** Suitable for single-machine deployments

#### OIDC Mode
- **Best for:** Production deployments, multi-user environments
- **Database:** PostgreSQL recommended for production
- **Authentication:** OAuth2/OIDC with Auth0, Google, or other providers
- **Sessions:** Database-backed session storage
- **Security:** Enterprise-grade authentication with SSO support

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Database connection string | - | Yes |
| `SESSION_SECRET` | Session encryption secret | - | Yes |
| `FORCE_LOCAL_AUTH` | Force SQLite authentication | false | No |
| `USE_DEV_AUTH` | Enable development auth mode | false | No |
| `OIDC_ISSUER_URL` | OIDC provider URL | - | OIDC mode |
| `OIDC_CLIENT_ID` | OIDC client identifier | - | OIDC mode |
| `OIDC_CLIENT_SECRET` | OIDC client secret | - | OIDC mode |
| `ALLOWED_DOMAINS` | Allowed authentication domains | localhost:5000 | OIDC mode |
| `AUTO_APPROVE_USERS` | Auto-approve new users | false | No |
| `NODE_ENV` | Application environment | development | No |
| `PORT` | Server port | 5000 | No |

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# For SQLite
# Ensure database file exists and is writable
ls -la permit_system.db
chmod 664 permit_system.db

# For PostgreSQL
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### 2. Authentication Not Working
```bash
# Check environment variables
echo $FORCE_LOCAL_AUTH
echo $DATABASE_URL

# Verify admin user exists (SQLite)
sqlite3 permit_system.db "SELECT * FROM users WHERE email='admin@localhost';"
```

#### 3. Port Conflicts
```bash
# Check what's running on port 5000
sudo netstat -tlnp | grep :5000
sudo lsof -i :5000

# Kill conflicting processes
sudo fuser -k 5000/tcp
```

#### 4. Apache2 Issues
```bash
# Check Apache status
sudo systemctl status apache2

# Check error logs
sudo tail -f /var/log/apache2/error.log

# Test Apache configuration
sudo apache2ctl configtest
```

### Log Locations

- **Application logs:** Console output during `npm run dev`
- **Apache access logs:** `/var/log/apache2/permit-*_access.log`
- **Apache error logs:** `/var/log/apache2/permit-*_error.log`
- **SQLite database:** `./permit_system.db`

## Testing the Installation

### 1. Local SQLite Mode
```bash
# Start the application
npm run dev

# Test login page
curl http://localhost:5000/api/login

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"admin123"}'
```

### 2. OIDC Mode
```bash
# Start production server
npm start

# Test OIDC login redirect
curl -I http://localhost:3001/api/login
```

## Default Credentials

### SQLite Mode
- **Email:** admin@localhost
- **Password:** admin123
- **Role:** Administrator

### OIDC Mode
- Users authenticate through configured OIDC provider
- First user with admin email becomes administrator

## Security Considerations

### For Production Deployments
1. **Change default passwords immediately**
2. **Use strong SESSION_SECRET (32+ characters)**
3. **Enable HTTPS with SSL certificates**
4. **Configure firewall rules**
5. **Regular database backups**
6. **Monitor access logs**

### For Development
1. **Use separate development databases**
2. **Don't expose development servers publicly**
3. **Keep development credentials separate**

## Support

### Getting Help
1. Check this installation guide
2. Review application logs
3. Verify environment configuration
4. Test database connectivity
5. Check Apache configuration (if used)

### Development Commands
```bash
# Database operations
npm run db:push          # Apply schema changes
npm run db:studio        # Open database browser
npm run db:reset         # Reset database

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Check code quality
npm run test             # Run tests
```

This guide provides complete installation instructions for both authentication modes. Choose the method that best fits your deployment needs.
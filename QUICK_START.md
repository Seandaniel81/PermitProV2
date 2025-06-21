# Quick Start Guide - Permit Management System

## Choose Your Deployment Option

### Option 1: One-Click Server Deployment
For online access with domain name:

```bash
curl -fsSL https://raw.githubusercontent.com/yourdomain/permit-system/main/scripts/deploy.sh | bash
```

### Option 2: Private Computer Installation
For local network use:

```bash
# Simple installation (recommended)
./install.sh

# Or detailed installation
./scripts/install-standalone.sh
```

### Option 3: Docker Deployment
```bash
# Clone repository
git clone <repository-url>
cd permit-system

# Basic deployment
docker-compose up -d

# Production with SSL and Redis
docker-compose --profile production up -d
```

## Authentication Options

### Auth0 (Recommended for Production)
- Enterprise-grade security
- Single Sign-On (SSO)
- Multi-factor authentication
- User management dashboard
- Social login providers

**Setup Steps:**
1. Create Auth0 account at auth0.com
2. Configure application settings
3. Add your domain/localhost to allowed URLs
4. Copy credentials to environment variables

### Local Authentication
- Simple username/password
- No external dependencies
- Immediate setup
- Perfect for development/testing

## After Installation

### Server Deployment
- Access: `https://yourdomain.com`
- Admin panel: Login as admin user
- SSL automatically configured
- System service runs on boot

### Private Installation  
- Access: `http://localhost:3000`
- Start: `./start.sh` or `start.bat`
- Desktop shortcut created
- Data stored locally

## Default Admin Access

### With Local Auth
- Navigate to login page
- Select "Admin User" from dropdown
- Full system access immediately

### With Auth0
- First user to register becomes admin
- Or assign admin role in Auth0 dashboard
- Configure user roles and permissions

## Key Features Available

### For Admins
- User management and approval
- System-wide package oversight
- Configuration settings
- Analytics and reports
- Database management

### For Users/Contractors
- Create and manage permit packages
- Upload required documents
- Track application progress
- Collaborate with team members
- Submit completed packages

## File Storage

### Server Deployment
- Documents: `/var/www/permit-system/uploads`
- Backups: `/var/www/permit-system/backups`
- Database: PostgreSQL

### Private Installation
- Documents: `./uploads`
- Backups: `./backups`
- Database: SQLite or PostgreSQL

## Security Features

### Production Security
- HTTPS encryption
- Secure session management
- Rate limiting
- CORS protection
- SQL injection prevention

### Auth0 Integration
- OAuth 2.0 / OpenID Connect
- JWT token validation
- Role-based access control
- Audit logging
- Compliance ready

## Support and Documentation

- **Production Deployment:** `PRODUCTION_DEPLOYMENT.md`
- **Auth0 Setup:** `AUTH0_SETUP.md`
- **API Documentation:** `/api/docs` (when running)
- **Health Check:** `/health`

## Troubleshooting

### Common Issues
1. **Port 3000 in use:** Change PORT in .env file
2. **Database connection:** Check DATABASE_URL
3. **Auth0 errors:** Verify callback URLs match exactly
4. **File uploads:** Ensure uploads directory is writable

### Getting Help
- Check application logs
- Review environment configuration
- Verify Auth0 application settings
- Test database connectivity

## Production Checklist

### Before Going Live
- [ ] Domain configured with SSL
- [ ] Auth0 application properly configured
- [ ] Database backups scheduled
- [ ] Firewall rules configured
- [ ] Admin users assigned
- [ ] File upload limits set
- [ ] Email notifications configured

### Security Review
- [ ] Change default passwords
- [ ] Enable multi-factor authentication
- [ ] Review user permissions
- [ ] Configure session timeouts
- [ ] Enable audit logging
- [ ] Set up monitoring alerts
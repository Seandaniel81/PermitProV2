# Quick Setup Guide

Your Permit Management System is now configured for **PostgreSQL + Apache + Bun** with **dual authentication** (local + GitHub OAuth) and **full admin user management**.

## What's Been Set Up

✅ **PostgreSQL Database** - Full production database with proper schema  
✅ **Apache Integration** - Reverse proxy configuration included  
✅ **Bun Runtime** - High-performance JavaScript runtime  
✅ **Dual Authentication** - Local login + GitHub OAuth (optional)  
✅ **Admin User Management** - Full CRUD operations restored  
✅ **File Upload System** - Secure document management  
✅ **Session Management** - PostgreSQL-backed sessions  

## Quick Start (3 Steps)

### 1. Install Bun (if not installed)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 2. Set Environment Variables
```bash
cp .env.example .env.production
nano .env.production
```

**Required Settings:**
```env
DATABASE_URL=postgresql://permit_user:your_password@localhost:5432/permit_system
SESSION_SECRET=your_64_character_random_string
```

### 3. Start Production Server
```bash
chmod +x bun-production.sh
./bun-production.sh
```

## Default Access

- **URL**: http://localhost:3000
- **Admin Login**: admin@localhost / admin123
- **Dashboard**: Full permit package management
- **User Management**: Create/edit/deactivate users
- **Settings**: System configuration

## Apache Integration

Copy the configuration to Apache:
```bash
sudo cp apache-config.conf /etc/apache2/sites-available/permit-system.conf
sudo a2ensite permit-system.conf
sudo a2enmod proxy proxy_http rewrite ssl headers
sudo systemctl restart apache2
```

Then access via: http://your-server-ip

## GitHub OAuth (Optional)

1. Create GitHub App at: https://github.com/settings/developers
2. Set callback URL: `https://your-domain.com/auth/github/callback`
3. Add credentials to `.env.production`:
```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback
```

## Admin Features Restored

**User Management:**
- ✅ Create new users with roles
- ✅ Reset user passwords  
- ✅ Activate/deactivate accounts
- ✅ Set user permissions (admin/user)
- ✅ View user activity and details

**System Management:**
- ✅ PostgreSQL database connection
- ✅ Settings configuration
- ✅ File upload management
- ✅ Session monitoring
- ✅ Statistics dashboard

## File Structure

```
your-project/
├── server/
│   ├── db.ts              # PostgreSQL connection
│   ├── dual-auth.ts       # Local + GitHub auth
│   ├── storage.ts         # Database operations
│   └── routes.ts          # API endpoints
├── shared/
│   └── schema.ts          # PostgreSQL schema
├── apache-config.conf     # Apache configuration
├── bun-production.sh      # Production startup
├── database-init.js       # Database initialization
└── PERSONAL_SERVER_SETUP.md # Detailed setup guide
```

## Troubleshooting

**Database Connection Failed:**
```bash
psql -h localhost -U permit_user permit_system
```

**Bun Server Won't Start:**
```bash
bun --version
cat .env.production
```

**Admin Access Denied:**
- Default login: admin@localhost / admin123
- Reset via database if needed

## Production Deployment

For detailed production setup with SSL, systemd, and security hardening, see `PERSONAL_SERVER_SETUP.md`.

Your system is now ready with PostgreSQL, Apache, Bun, and full admin capabilities!
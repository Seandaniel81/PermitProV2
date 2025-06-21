# Production Deployment Guide

This permit management system supports two production deployment modes:

## Option 1: Online Server Deployment (Cloud/VPS)

### Requirements
- Ubuntu/Debian server with root access
- Node.js 18+ and npm
- PostgreSQL 12+
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

### Quick Server Setup
```bash
# Run the automated server setup
curl -fsSL https://raw.githubusercontent.com/yourdomain/permit-system/main/scripts/server-install.sh | bash
```

### Manual Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres createdb permit_system
sudo -u postgres createuser --interactive permit_user

# Clone and setup application
git clone <your-repo> /var/www/permit-system
cd /var/www/permit-system
npm install
npm run build

# Setup environment
cp .env.production .env
# Edit .env with your production settings

# Setup systemd service
sudo cp scripts/permit-system.service /etc/systemd/system/
sudo systemctl enable permit-system
sudo systemctl start permit-system

# Setup Nginx reverse proxy
sudo apt install nginx -y
sudo cp scripts/nginx.conf /etc/nginx/sites-available/permit-system
sudo ln -s /etc/nginx/sites-available/permit-system /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## Option 2: Private Computer Installation (Standalone)

### Windows Installation
1. Download the Windows installer: `permit-system-windows-installer.exe`
2. Run as administrator
3. Follow installation wizard
4. Access at `http://localhost:3000`

### Linux/Mac Installation
```bash
# Download and run the installer
curl -fsSL https://install.permit-system.com/install.sh | bash

# Or manual installation
wget https://github.com/yourdomain/permit-system/releases/latest/permit-system-standalone.tar.gz
tar -xzf permit-system-standalone.tar.gz
cd permit-system-standalone
./install.sh
```

### Docker Installation (All Platforms)
```bash
# Pull and run the container
docker run -d \
  --name permit-system \
  -p 3000:3000 \
  -v permit-data:/app/data \
  -v permit-uploads:/app/uploads \
  permit-system/app:latest

# Access at http://localhost:3000
```

## Configuration Options

### Online Server Configuration
- Multi-user support with authentication
- SSL/HTTPS encryption
- Database backup and replication
- Email notifications
- API access for integrations

### Private Computer Configuration
- Single-user or small team mode
- Local database (SQLite or PostgreSQL)
- File-based storage
- No external dependencies
- Offline operation capability

## Security Considerations

### Online Server
- Enable firewall (UFW recommended)
- Regular security updates
- Database encryption
- Rate limiting
- Access logs monitoring

### Private Computer
- Local network access only
- Optional password protection
- Data encryption at rest
- Regular local backups

## Maintenance

### Online Server
- Automated backups to cloud storage
- Log rotation and monitoring
- Performance monitoring
- Security updates via package manager

### Private Computer
- Manual backup recommendations
- Update notifications
- Health check dashboard
- Data export capabilities
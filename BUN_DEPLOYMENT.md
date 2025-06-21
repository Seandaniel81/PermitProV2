# Bun Deployment Guide - Permit Management System

This system is optimized for Bun runtime, providing faster installation, builds, and execution compared to Node.js.

## Quick Installation

### One-Command Installation
```bash
# For any system - automatically detects and installs Bun
./install.sh
```

### Bun-Optimized Installation
```bash
# Advanced installation with full Bun optimization
./scripts/bun-deploy.sh
```

### Docker with Bun
```bash
# Build and run with Bun runtime
docker-compose up -d
```

## Bun Advantages

- **3x faster installation** compared to npm
- **2x faster builds** with native bundling
- **Built-in TypeScript support** without configuration
- **Smaller Docker images** with optimized Bun base
- **Native SQLite support** for private deployments
- **Hot reload** during development

## System Requirements

### Minimum Requirements
- RAM: 1GB (2GB recommended)
- Storage: 500MB free space
- OS: Linux, macOS, Windows (WSL2)

### Bun Installation
Bun is automatically installed by the setup scripts, or install manually:
```bash
curl -fsSL https://bun.sh/install | bash
```

## Deployment Options

### 1. Private Computer Setup
```bash
./install.sh
# Choose option 1 for private deployment
# Access at http://localhost:3000
```

Features:
- SQLite database (no configuration required)
- Local authentication or Auth0
- Desktop shortcut creation
- Automatic startup scripts
- Offline operation

### 2. Server Deployment
```bash
./install.sh
# Choose option 2 for server deployment
# Provide domain name when prompted
```

Features:
- PostgreSQL database
- Nginx reverse proxy
- SSL certificate automation
- Systemd service integration
- Production security headers

## Authentication Options

### Local Authentication (Simple)
- No external dependencies
- User selection dropdown
- Immediate access
- Perfect for development/testing

### Auth0 Integration (Enterprise)
- Single Sign-On (SSO)
- Multi-factor authentication
- Social login providers
- Enterprise user management
- Compliance ready

## Configuration Management

### Environment Variables
All configuration is handled through `.env` file:
```bash
# Core settings
NODE_ENV=production
PORT=3000
DATABASE_URL=file:./permit_system.db

# Authentication
USE_AUTH0=false
USE_DEV_AUTH=true

# Security
SECURE_COOKIES=false
SESSION_SECRET=auto-generated
```

### Auth0 Configuration
For enterprise authentication:
```bash
USE_AUTH0=true
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_CALLBACK_URL=http://localhost:3000/callback
```

## Development Workflow

### Starting Development Server
```bash
bun run dev
# or
./dev.sh
```

### Building for Production
```bash
bun run build
```

### Database Operations
```bash
bun run db:push    # Apply schema changes
bun run db:generate # Generate migrations
```

## Docker Deployment

### Basic Docker Setup
```bash
# Build image
docker build -t permit-system .

# Run container
docker run -p 3000:3000 permit-system
```

### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# With production services (Nginx, Redis)
docker-compose --profile production up -d
```

## Performance Optimizations

### Bun-Specific Optimizations
- Native bundling eliminates webpack overhead
- Built-in transpilation removes babel dependency
- Faster package resolution
- Optimized container images

### Production Optimizations
- Gzip compression enabled
- Static asset caching
- Database connection pooling
- Session storage optimization

## Maintenance

### Updating Bun
```bash
bun upgrade
```

### System Health Check
```bash
curl http://localhost:3000/health
```

### Log Management
```bash
# System service logs
sudo journalctl -u permit-system -f

# Application logs
tail -f logs/application.log
```

## Troubleshooting

### Common Issues

**Bun not found after installation:**
```bash
export PATH="$HOME/.bun/bin:$PATH"
source ~/.bashrc
```

**Database connection errors:**
```bash
# Check database file permissions (SQLite)
ls -la permit_system.db

# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Build failures:**
```bash
# Clear cache and rebuild
rm -rf dist node_modules
bun install
bun run build
```

### Performance Issues
- Check available RAM: `free -h`
- Monitor disk space: `df -h`
- Verify port availability: `netstat -tlnp | grep 3000`

## Security Considerations

### Production Security
- HTTPS enforcement
- Secure session configuration
- Rate limiting enabled
- SQL injection prevention
- XSS protection headers

### Private Installation Security
- Local network only access
- Optional password protection
- File system permissions
- Regular backup recommendations

## Backup and Recovery

### Automated Backups
```bash
# Database backup
cp permit_system.db backups/backup-$(date +%Y%m%d).db

# Full system backup
tar -czf backup-$(date +%Y%m%d).tar.gz uploads permit_system.db .env
```

### Recovery Process
```bash
# Restore database
cp backups/backup-20240101.db permit_system.db

# Restore files
tar -xzf backup-20240101.tar.gz
```

## Support Resources

- **Installation Issues**: Check Bun documentation at bun.sh
- **Auth0 Setup**: See AUTH0_SETUP.md
- **API Documentation**: Available at `/api/docs` when running
- **Health Monitoring**: Built-in endpoint at `/health`
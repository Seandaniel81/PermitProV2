# Independent Database Deployment Guide

This permit management system is designed for independent hosting at home or business locations with its own PostgreSQL database.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- Git (for cloning the repository)

## Quick Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd permit-management-system
npm install
```

2. **Setup Database**
```bash
# Create PostgreSQL database
createdb permits_db

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

3. **Configure Environment**
Edit `.env` file with your settings:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/permits_db
SESSION_SECRET=generate-a-secure-random-string
```

4. **Initialize Database**
```bash
node scripts/setup-database.js
```

5. **Start Application**
```bash
npm run build
npm start
```

## Database Management

### Backup Database
```bash
node scripts/backup-database.js
```
Backups are saved to `./backups/` directory.

### Restore Database
```bash
node scripts/restore-database.js ./backups/backup-file.sql
```

### Manual Database Operations
```bash
# Push schema changes
npm run db:push

# View database with Drizzle Studio
npm run db:studio
```

## Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```bash
# Build container
docker build -t permit-system .

# Run with database
docker-compose up -d
```

### Using systemd (Linux)
```bash
# Copy service file
sudo cp scripts/permit-system.service /etc/systemd/system/

# Enable and start
sudo systemctl enable permit-system
sudo systemctl start permit-system
```

## Security Considerations

- Change default SESSION_SECRET to a strong random value
- Use SSL/TLS certificates for HTTPS in production
- Configure firewall to limit database access
- Regular database backups
- Keep PostgreSQL updated

## File Storage

- Document uploads stored in `./uploads/` directory
- Ensure sufficient disk space for document storage
- Consider backup strategy for uploaded files

## Network Configuration

- Default port: 5000
- Configure reverse proxy (nginx/Apache) for production
- Set up SSL certificates
- Configure domain name and DNS

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Confirm database exists and credentials are correct

### Permission Issues
- Ensure uploads directory is writable
- Check file system permissions
- Verify PostgreSQL user has necessary privileges

### Performance Optimization
- Index database tables appropriately
- Configure PostgreSQL memory settings
- Monitor disk space usage
- Set up log rotation

## Maintenance

### Regular Tasks
- Database backups (automated recommended)
- Log file rotation
- Software updates
- SSL certificate renewal

### Monitoring
- Check application logs
- Monitor database performance
- Track disk space usage
- Review user access logs
# Production Deployment Guide

## Quick Production Start

Your permit management system is ready for production deployment. Follow these steps:

### 1. Stop Development Server
```bash
# Kill the development server if running
pkill -f "tsx server/index.ts"
```

### 2. Build and Start Production
```bash
# Build the application
npm run build

# Start production server
NODE_ENV=production \
PORT=3001 \
DATABASE_URL=file:./permit_system.db \
FORCE_LOCAL_AUTH=true \
SESSION_SECRET=your_secure_secret_here \
node dist/index.js
```

### 3. Access Production System
- **URL**: http://localhost:3001
- **Login**: admin@localhost
- **Password**: admin123

## Production Features

✅ **SQLite Database**: Self-contained, no external database required
✅ **Local Authentication**: Simple username/password authentication
✅ **File Uploads**: Secure document management
✅ **Session Management**: Persistent user sessions
✅ **Admin Dashboard**: Complete administrative interface
✅ **Package Management**: Full permit package workflow

## Production Configuration

### Environment Variables
```bash
NODE_ENV=production          # Production mode
PORT=3001                   # Production port (avoids conflict with dev)
DATABASE_URL=file:./permit_system.db  # SQLite database
FORCE_LOCAL_AUTH=true       # Use local authentication
SESSION_SECRET=secure_key   # Session encryption key
```

### Database Setup
The system automatically creates the SQLite database with:
- Admin user (admin@localhost / admin123)
- All required tables (users, packages, documents, settings)
- Sample permit packages for testing

### File Structure
```
permit_system.db        # SQLite database
dist/                   # Built application
uploads/                # File uploads directory
```

## Production Deployment Options

### Option 1: Local Computer (Recommended for Small Teams)
1. Install Node.js 18+
2. Clone the project
3. Run `npm install`
4. Follow Quick Production Start above
5. Access at http://localhost:3001

### Option 2: Server Deployment
1. Set up Ubuntu/Debian server
2. Install Node.js, PM2, and Nginx
3. Deploy application files
4. Configure reverse proxy
5. Set up SSL certificate

### Option 3: Apache Integration (Your Kali Linux Setup)
```bash
# Configure Apache reverse proxy
sudo a2enmod proxy proxy_http
sudo systemctl restart apache2

# Add to Apache configuration:
ProxyPass /permit http://localhost:3001/
ProxyPassReverse /permit http://localhost:3001/
```

## Security Considerations

### Production Checklist
- [ ] Change default admin password
- [ ] Set secure SESSION_SECRET
- [ ] Enable HTTPS (recommended)
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Monitor log files

### Backup Strategy
```bash
# Backup database
cp permit_system.db backup_$(date +%Y%m%d).db

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## Monitoring

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Log Monitoring
```bash
# View application logs
tail -f production.log

# Monitor system resources
htop
```

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port
lsof -i :3001
# Kill process and restart
```

**Database Locked**
```bash
# Check for database locks
fuser permit_system.db
# Restart application if needed
```

**Permission Issues**
```bash
# Fix file permissions
chmod 644 permit_system.db
chmod -R 755 uploads/
```

### Performance Tuning

**For High Load**
- Use PM2 for process management
- Configure nginx reverse proxy
- Set up database connection pooling
- Enable gzip compression

**Resource Monitoring**
```bash
# CPU and memory usage
ps aux | grep node

# Disk space
df -h

# Database size
ls -lh permit_system.db
```

## Maintenance

### Regular Tasks
- Weekly database backups
- Monthly log rotation
- Quarterly security updates
- Annual password changes

### Updates
```bash
# Update dependencies
npm update

# Rebuild application
npm run build

# Restart production server
```

## Support

### System Requirements
- Node.js 18+
- 2GB RAM minimum
- 10GB disk space
- Linux/Windows/macOS

### Contact
For technical support or questions about deployment, consult the system documentation or contact your administrator.
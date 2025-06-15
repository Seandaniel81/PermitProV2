# Building Permit Package Management System

A comprehensive permit management system designed for independent hosting at home or business locations with complete database autonomy.

## Features

- **Independent Database Storage**: Full PostgreSQL database with complete data ownership
- **User Registration & Admin Approval**: Secure user management with administrator oversight
- **Document Management**: Upload, organize, and track permit documents with file storage
- **Package Tracking**: Complete permit package lifecycle management
- **System Monitoring**: Built-in health monitoring and backup capabilities
- **Multi-Environment Support**: Development, staging, and production configurations

## Quick Start

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 12 or higher
- 2GB+ available disk space

### Installation

1. **Clone and Setup**
```bash
git clone <repository-url>
cd permit-management-system
chmod +x scripts/install.sh
./scripts/install.sh
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Initialize Database**
```bash
node scripts/setup-database.js
```

4. **Start Application**
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Independent Database Architecture

### Database Design
- **PostgreSQL**: Primary database engine for data persistence
- **Drizzle ORM**: Type-safe database operations and migrations
- **Schema Management**: Automated table creation and updates
- **Data Integrity**: Foreign key constraints and validation

### Storage Independence
- **Local File Storage**: All document uploads stored locally
- **Database Backup**: Automated and manual backup capabilities
- **Data Portability**: Easy migration between environments
- **No External Dependencies**: Complete system autonomy

## System Administration

### User Management
- **Admin Approval**: All new users require administrator approval
- **Role-Based Access**: Admin and user permission levels
- **Account Status**: Pending, approved, and rejected user states
- **Audit Trail**: User activity and approval tracking

### Database Management

#### Backup Database
```bash
# Automated backup
node scripts/backup-database.js

# Manual backup with custom location
pg_dump -h localhost -U username -d permits_db > backup.sql
```

#### Restore Database
```bash
# From backup file
node scripts/restore-database.js ./backups/backup-file.sql

# Manual restore
psql -h localhost -U username -d permits_db < backup.sql
```

#### Schema Updates
```bash
# Push schema changes
npm run db:push

# View database structure
npm run db:studio
```

### System Monitoring

#### Health Endpoints
- `GET /api/health` - System health status
- `GET /api/system/status` - Detailed system information (admin only)
- `POST /api/system/backup` - Create database backup (admin only)

#### Monitoring Metrics
- Database connectivity and response time
- File system write permissions
- Disk space utilization
- Memory usage and system uptime

## Deployment Options

### Local Development
```bash
npm run dev
```

### Production with PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Docker Deployment
```bash
docker-compose up -d
```

### Systemd Service (Linux)
```bash
sudo cp scripts/permit-system.service /etc/systemd/system/
sudo systemctl enable permit-system
sudo systemctl start permit-system
```

## Security Features

### Data Protection
- **Session Management**: Secure user sessions with database storage
- **File Upload Validation**: Restricted file types and size limits
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **Input Validation**: Comprehensive data validation using Zod schemas

### Access Control
- **Authentication**: OpenID Connect integration
- **Authorization**: Role-based access control
- **Admin Privileges**: Restricted administrative functions
- **Audit Logging**: User action tracking and monitoring

## File Management

### Document Storage
- **Local Storage**: All files stored in `./uploads` directory
- **File Types**: PDF, images, Word documents
- **Size Limits**: Configurable file size restrictions
- **Organization**: Automatic file organization by package

### Backup Strategy
- **Database Backups**: Regular automated backups
- **File Backups**: Include uploaded documents in backup strategy
- **Retention Policy**: Configurable backup retention periods
- **Restore Procedures**: Documented recovery processes

## Configuration

### Environment Variables
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/permits_db
PGHOST=localhost
PGPORT=5432
PGDATABASE=permits_db
PGUSER=username
PGPASSWORD=password

# Application Settings
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secure-session-secret

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Backup Configuration
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP=true
```

### Custom Configuration
- **Upload Limits**: Adjust file size and type restrictions
- **Backup Schedule**: Configure automatic backup frequency
- **Security Settings**: Customize session timeout and security headers
- **Performance Tuning**: Database connection pooling and caching

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Confirm database exists and credentials are correct
- Test connection with `psql`

#### File Upload Problems
- Check uploads directory permissions
- Verify disk space availability
- Review file size and type restrictions
- Examine server logs for errors

#### Performance Issues
- Monitor database performance
- Check available memory and CPU
- Review disk I/O usage
- Optimize database queries

### System Maintenance

#### Regular Tasks
- Database backups (automated)
- Log file rotation
- Disk space monitoring
- Software updates
- Security patches

#### Performance Optimization
- Database index maintenance
- File system cleanup
- Memory usage monitoring
- Connection pool tuning

## Support and Documentation

### Getting Help
- Review system logs for error messages
- Check health monitoring endpoints
- Verify configuration settings
- Test database connectivity

### Additional Resources
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [.env.example](./.env.example) - Configuration template
- Health monitoring dashboard at `/api/system/status`

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

**Note**: This system is designed for complete independence from external services. All data remains under your control and can be hosted entirely on your own infrastructure.
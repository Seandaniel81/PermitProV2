# Permit Management System

A comprehensive building permit package management system for tracking assembly progress and storing packages until submission.

## Features

- **Package Management**: Create, edit, and track building permit packages
- **Document Checklist**: Manage required documents for each permit type
- **Status Tracking**: Monitor progress from draft to submission
- **User Management**: Role-based access control for administrators and users
- **Dashboard Analytics**: Overview of package statistics and progress
- **File Upload**: Secure document storage and management

## Requirements

- Bun runtime (or Node.js 18+)
- PostgreSQL 12+
- Standard PostgreSQL database (not serverless variants)

## Quick Installation

Run the automated installation script:

```bash
chmod +x install.sh
./install.sh
```

The script will:
1. Check system requirements
2. Install dependencies
3. Create necessary directories
4. Set up environment configuration
5. Build the application
6. Initialize the database

## Manual Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd permit-management-system
bun install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/permits_db

# Authentication
SESSION_SECRET=your-secure-session-secret-here

# Application Settings
NODE_ENV=production
PORT=5000
```

### 3. Database Setup

Create your PostgreSQL database:
```bash
createdb permits_db
```

Push the schema and seed initial data:
```bash
bun run db:push
bun run scripts/setup-database.ts
```

### 4. Build and Start

```bash
bun run build
bun start
```

## Development

For development with hot reload:
```bash
bun run dev
```

The application will be available at `http://localhost:5000`

## Production Deployment

### Using PM2 (Recommended)

```bash
bun install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Docker

```bash
docker build -t permit-management .
docker run -p 5000:5000 -e DATABASE_URL=your_db_url permit-management
```

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Schema

The system uses the following main entities:
- **Users**: System users with role-based access
- **Permit Packages**: Building permit applications
- **Package Documents**: Required documents for each package
- **Settings**: System configuration

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Packages
- `GET /api/packages` - List all packages
- `POST /api/packages` - Create new package
- `GET /api/packages/:id` - Get package details
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

### Documents
- `GET /api/packages/:id/documents` - Get package documents
- `POST /api/packages/:id/documents` - Add document to package
- `PUT /api/documents/:id` - Update document
- `POST /api/documents/:id/upload` - Upload document file

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SESSION_SECRET` | Session encryption key | Required |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` |

### Authentication Setup

The application uses OpenID Connect for authentication. You need to configure an OAuth provider:

1. **Quick Setup with Google:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Set redirect URI: `https://yourdomain.com/api/callback`
   - Update `.env` with your credentials

2. **Configuration:**
   ```bash
   OIDC_ISSUER_URL=https://accounts.google.com
   OIDC_CLIENT_ID=your-google-client-id
   OIDC_CLIENT_SECRET=your-google-client-secret
   ALLOWED_DOMAINS=yourdomain.com
   ```

3. **See `OIDC_SETUP.md` for detailed provider setup instructions**

### Default Users

After initial setup, the first user to log in becomes an administrator. Additional users require approval unless `AUTO_APPROVE_USERS=true` is set.

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

### Permission Issues
```bash
# Fix upload directory permissions
chmod 755 uploads logs backups
```

### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist
bun install
bun run build
```

## Support

For issues and support, please check the logs:
- Application logs: `logs/combined.log`
- Error logs: `logs/err.log`
- PM2 logs: `pm2 logs`

## License

MIT License - see LICENSE file for details.
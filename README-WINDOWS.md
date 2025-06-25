# Windows Installation Package

Complete Windows installer for the Permit Management System with PostgreSQL database, Apache web server, and Bun runtime.

## 🚀 Quick Start

### Automatic Installation (Recommended)

**1. Download and run PowerShell installer:**
```powershell
# Right-click PowerShell and "Run as Administrator"
.\windows-installer.ps1
```

**2. Or use the simple batch installer:**
```cmd
# Right-click and "Run as Administrator"  
windows-simple-installer.bat
```

**3. Start the system:**
- Double-click "Start Permit System" on desktop
- Open browser to: http://localhost:3000
- Login: admin@localhost / admin123

## 📦 What Gets Installed

✅ **PostgreSQL Database** - Production-ready database  
✅ **Bun Runtime** - High-performance JavaScript runtime  
✅ **Apache Web Server** - Optional reverse proxy  
✅ **Application Code** - Complete permit management system  
✅ **Windows Service** - Optional background service  
✅ **Desktop Shortcuts** - Easy access shortcuts  
✅ **Firewall Rules** - Automatic port configuration  

## 🔧 Installation Options

### PowerShell Installer Features
```powershell
# Custom installation directory
.\windows-installer.ps1 -InstallPath "D:\PermitSystem"

# Include Apache web server
.\windows-installer.ps1 -InstallApache

# Set database password
.\windows-installer.ps1 -DatabasePassword "yourpassword"

# Skip prerequisite software
.\windows-installer.ps1 -SkipPrerequisites

# Show all options
.\windows-installer.ps1 -Help
```

### Simple Batch Installer
- Essential components only
- Minimal user interaction
- PostgreSQL + Bun + Application
- Desktop shortcut creation

## 🖥️ System Requirements

**Minimum:**
- Windows 10 (version 1903) or Windows 11
- 4GB RAM (8GB recommended)
- 5GB free disk space
- Internet connection for installation

**Administrator privileges required for installation**

## 📁 Installation Structure

```
C:\PermitSystem\                  # Default installation
├── app\                          # Application files
│   ├── .env                      # Configuration
│   ├── package.json              # Dependencies
│   └── uploads\                  # File storage
├── start-permit-system.bat       # Startup script
└── install-service.bat           # Service installer
```

## 🔑 Default Credentials

**Application Admin:**
- Email: admin@localhost
- Password: admin123

**Database:**
- User: permit_user
- Password: permit123
- Database: permit_system

**⚠️ Change these passwords after installation!**

## 🌐 Access Methods

### Local Access
- **Application:** http://localhost:3000
- **Dashboard:** Full permit management interface
- **Admin Panel:** User management and settings

### Network Access (Optional)
- Configure Apache for external access
- Set up SSL certificates for HTTPS
- Configure firewall for network access

## 🛠️ Post-Installation

### Start as Application
```cmd
# Start manually
C:\PermitSystem\start-permit-system.bat

# Or use desktop shortcut
```

### Install as Windows Service
```cmd
# Install NSSM service wrapper
choco install nssm -y

# Install permit system service
nssm install PermitSystem "C:\PermitSystem\app\bun.exe"
nssm set PermitSystem AppParameters "start"
nssm set PermitSystem AppDirectory "C:\PermitSystem\app"

# Start service
net start PermitSystem
```

### Configure Apache (Optional)
If Apache was installed:
1. Edit `C:\Program Files\Apache Group\Apache2\conf\httpd.conf`
2. Add: `Include conf/extra/permit-system.conf`
3. Restart Apache service
4. Access via: http://localhost

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
DATABASE_URL=postgresql://permit_user:permit123@localhost:5432/permit_system

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
SESSION_SECRET=your_secure_secret

# File Uploads
UPLOAD_DIR=C:/PermitSystem/uploads
MAX_FILE_SIZE=10485760

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Windows Firewall
Automatic rules created for:
- Port 3000 (Permit System)
- Port 80 (Apache, if installed)

## 🐛 Troubleshooting

### Installation Issues

**"Run as Administrator" required:**
- Right-click installer
- Select "Run as Administrator"

**PostgreSQL installation fails:**
- Download manually from postgresql.org
- Install with password
- Run installer again with `-SkipPrerequisites`

**Bun installation fails:**
- Check internet connection
- Temporarily disable antivirus
- Run: `powershell -c "irm bun.sh/install.ps1 | iex"`

### Runtime Issues

**"bun: command not found":**
- Restart command prompt
- Add to PATH: `%USERPROFILE%\.bun\bin`

**Database connection failed:**
- Check PostgreSQL service in services.msc
- Verify password: `psql -h localhost -U permit_user permit_system`

**Port 3000 in use:**
- Change PORT in `.env` file
- Update firewall rules

### Service Issues

**Service won't start:**
```cmd
# Check service status
nssm status PermitSystem

# View service logs
# Check Windows Event Viewer > System
```

**Service permissions:**
- Ensure service runs as Local System
- Check file permissions on installation directory

## 🗑️ Uninstallation

### Remove Application
```cmd
# Stop service (if installed)
net stop PermitSystem
nssm remove PermitSystem confirm

# Remove files
rmdir /s "C:\PermitSystem"

# Remove shortcuts
del "%USERPROFILE%\Desktop\Start Permit System.lnk"
del "%USERPROFILE%\Desktop\Install Permit Service.lnk"
del "%USERPROFILE%\Desktop\Permit System Dashboard.lnk"

# Remove firewall rules
netsh advfirewall firewall delete rule name="Permit System"
```

### Remove Software (Optional)
```cmd
# Uninstall via Chocolatey
choco uninstall postgresql -y
choco uninstall apache-httpd -y

# Or use Windows Add/Remove Programs
```

## 📞 Support

### Log Locations
- **Application Logs:** Windows Event Viewer
- **PostgreSQL Logs:** `C:\Program Files\PostgreSQL\16\data\log\`
- **Apache Logs:** `C:\Program Files\Apache Group\Apache2\logs\`

### Configuration Files
- **Application:** `C:\PermitSystem\app\.env`
- **Database:** PostgreSQL connection via DATABASE_URL
- **Apache:** `C:\Program Files\Apache Group\Apache2\conf\extra\permit-system.conf`

### Health Check
Test if system is working:
```cmd
# Check if server is running
curl http://localhost:3000/api/health

# Expected response: {"status":"healthy","database":"connected"}
```

Your Windows installation package is complete and ready for deployment on personal computers!
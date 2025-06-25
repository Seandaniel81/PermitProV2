# Windows Installation Guide

Complete Windows installation package for the Permit Management System with PostgreSQL, Apache, and Bun runtime.

## Quick Installation (Recommended)

### Option 1: PowerShell Installer (Full Featured)
```powershell
# Run as Administrator
.\windows-installer.ps1
```

**Features:**
- ✅ Automatic prerequisite installation
- ✅ PostgreSQL database setup
- ✅ Apache web server (optional)
- ✅ Desktop shortcuts
- ✅ Windows service installation
- ✅ Firewall configuration

### Option 2: Batch File Installer (Simple)
```cmd
REM Run as Administrator
windows-simple-installer.bat
```

**Features:**
- ✅ Essential components only
- ✅ PostgreSQL database setup  
- ✅ Desktop shortcut
- ✅ Basic firewall rules

## Manual Installation Steps

### 1. Prerequisites
Run PowerShell as Administrator and install Chocolatey:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 2. Install Required Software
```powershell
# Install Git
choco install git -y

# Install Node.js
choco install nodejs -y

# Install PostgreSQL (set password when prompted)
choco install postgresql --params "/Password:yourpassword" -y

# Install Visual C++ Redistributables
choco install vcredist-all -y

# Install Apache (optional)
choco install apache-httpd -y
```

### 3. Install Bun Runtime
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 4. Setup Database
```cmd
# Find PostgreSQL installation (usually in Program Files)
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres

# In PostgreSQL shell:
CREATE USER permit_user WITH PASSWORD 'permit123';
CREATE DATABASE permit_system OWNER permit_user;
GRANT ALL PRIVILEGES ON DATABASE permit_system TO permit_user;
\q
```

### 5. Create Application Directory
```cmd
mkdir C:\PermitSystem\app
cd C:\PermitSystem\app
```

### 6. Setup Application
Create `package.json`:
```json
{
  "name": "permit-management-system",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "start": "bun server/index.js",
    "dev": "bun --watch server/index.ts"
  },
  "dependencies": {
    "express": "^4.21.2",
    "bcryptjs": "^3.0.2",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "express-session": "^1.18.1",
    "connect-pg-simple": "^10.0.0",
    "pg": "^8.13.1"
  }
}
```

Create `.env`:
```env
DATABASE_URL=postgresql://permit_user:permit123@localhost:5432/permit_system
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
SESSION_SECRET=your_secure_random_64_character_string_here
```

Install dependencies:
```cmd
bun install
```

## Installation Options

### PowerShell Installer Options
```powershell
# Custom installation path
.\windows-installer.ps1 -InstallPath "D:\MyPermitSystem"

# Include Apache web server
.\windows-installer.ps1 -InstallApache

# Set database password
.\windows-installer.ps1 -DatabasePassword "mypassword123"

# Skip prerequisite installation
.\windows-installer.ps1 -SkipPrerequisites

# Show help
.\windows-installer.ps1 -Help
```

## Post-Installation

### Start the System
**Option 1:** Double-click "Start Permit System" desktop shortcut

**Option 2:** Command line
```cmd
cd C:\PermitSystem
start-permit-system.bat
```

**Option 3:** Install as Windows Service
```cmd
# Install NSSM (service wrapper)
choco install nssm -y

# Install service
nssm install PermitSystem "C:\PermitSystem\app\bun.exe"
nssm set PermitSystem AppParameters "start"
nssm set PermitSystem AppDirectory "C:\PermitSystem\app"
nssm set PermitSystem DisplayName "Permit Management System"

# Start service
net start PermitSystem
```

### Access the System
- **URL:** http://localhost:3000
- **Admin Login:** admin@localhost / admin123
- **Dashboard:** Full permit management interface

### Apache Integration (Optional)
If Apache was installed, configure virtual host:

Edit `C:\Program Files\Apache Group\Apache2\conf\httpd.conf`:
```apache
# Enable modules
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule rewrite_module modules/mod_rewrite.so

# Include permit system config
Include conf/extra/permit-system.conf
```

The installer creates `permit-system.conf` automatically.

## Firewall Configuration

The installer automatically adds Windows Firewall rules:
- Port 3000 (Permit System)
- Port 80 (Apache, if installed)

Manual firewall configuration:
```cmd
netsh advfirewall firewall add rule name="Permit System" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Apache HTTP" dir=in action=allow protocol=TCP localport=80
```

## File Locations

### Default Installation
```
C:\PermitSystem\
├── app\                          # Application files
│   ├── server\                   # Server code
│   ├── package.json              # Dependencies
│   ├── .env                      # Configuration
│   └── uploads\                  # File uploads
├── start-permit-system.bat       # Startup script
└── install-service.bat           # Service installer
```

### Desktop Shortcuts
- `Start Permit System.lnk` - Launch application
- `Install Permit Service.lnk` - Install Windows service
- `Permit System Dashboard.lnk` - Open in browser

### Logs
- **Application:** Windows Event Viewer > Applications and Services Logs
- **PostgreSQL:** `C:\Program Files\PostgreSQL\16\data\log\`
- **Apache:** `C:\Program Files\Apache Group\Apache2\logs\`

## Troubleshooting

### Common Issues

**"bun: command not found"**
- Restart command prompt after installation
- Check PATH: `echo %PATH%` should include `%USERPROFILE%\.bun\bin`

**Database connection failed**
- Verify PostgreSQL service is running: `services.msc`
- Test connection: `psql -h localhost -U permit_user permit_system`
- Check PostgreSQL logs

**Port 3000 already in use**
- Change PORT in `.env` file
- Update firewall rules for new port

**Permission denied errors**
- Run as Administrator
- Check folder permissions on `C:\PermitSystem`

### Service Management
```cmd
# Start service
net start PermitSystem

# Stop service
net stop PermitSystem

# Remove service
nssm remove PermitSystem confirm
```

### Uninstallation
```cmd
# Stop service (if installed)
net stop PermitSystem
nssm remove PermitSystem confirm

# Remove application
rmdir /s "C:\PermitSystem"

# Remove shortcuts
del "%USERPROFILE%\Desktop\Start Permit System.lnk"
del "%USERPROFILE%\Desktop\Install Permit Service.lnk"
del "%USERPROFILE%\Desktop\Permit System Dashboard.lnk"

# Remove firewall rules
netsh advfirewall firewall delete rule name="Permit System"
```

## System Requirements

### Minimum Requirements
- **OS:** Windows 10 (1903) or Windows 11
- **RAM:** 4GB (8GB recommended)
- **Storage:** 5GB free space
- **Network:** Internet connection for installation

### Software Dependencies
- PostgreSQL 12+
- Bun runtime
- Visual C++ Redistributables
- Git (for updates)

## Security Notes

### Default Credentials
- **Database:** permit_user / permit123
- **Admin:** admin@localhost / admin123

**Important:** Change these passwords after installation!

### Network Security
- Default installation binds to localhost only
- Configure firewall rules for external access
- Use HTTPS in production (configure Apache SSL)

### File Permissions
- Upload directory: `C:\PermitSystem\app\uploads`
- Ensure proper write permissions
- Regular backup recommended

Your Windows installation package is complete and ready for deployment!
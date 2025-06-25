# Windows Installation Script for Permit Management System
# PowerShell script for Windows 10/11 installation

param(
    [switch]$SkipPrerequisites,
    [string]$InstallPath = "C:\PermitSystem",
    [string]$DatabasePassword = "",
    [switch]$InstallApache,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Windows Permit Management System Installer

USAGE:
    .\windows-installer.ps1 [OPTIONS]

OPTIONS:
    -InstallPath <path>     Installation directory (default: C:\PermitSystem)
    -DatabasePassword <pwd> PostgreSQL password (will prompt if not provided)
    -InstallApache         Install and configure Apache web server
    -SkipPrerequisites     Skip prerequisite software installation
    -Help                  Show this help message

EXAMPLES:
    .\windows-installer.ps1
    .\windows-installer.ps1 -InstallPath "D:\MyPermitSystem" -InstallApache
    .\windows-installer.ps1 -DatabasePassword "mypassword123"
"@
    exit 0
}

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "=== Windows Permit Management System Installer ===" -ForegroundColor Green
Write-Host "Installation Path: $InstallPath" -ForegroundColor Cyan

# Create installation directory
if (!(Test-Path $InstallPath)) {
    New-Item -Path $InstallPath -ItemType Directory -Force | Out-Null
    Write-Host "Created installation directory: $InstallPath" -ForegroundColor Green
}

# Function to download file
function Download-File {
    param($Url, $Path)
    try {
        Write-Host "Downloading: $Url" -ForegroundColor Yellow
        Invoke-WebRequest -Uri $Url -OutFile $Path -UseBasicParsing
        return $true
    } catch {
        Write-Host "Failed to download: $Url" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

# Function to install software silently
function Install-Software {
    param($Path, $Arguments = "/S")
    try {
        Write-Host "Installing: $Path" -ForegroundColor Yellow
        Start-Process -FilePath $Path -ArgumentList $Arguments -Wait
        return $true
    } catch {
        Write-Host "Failed to install: $Path" -ForegroundColor Red
        return $false
    }
}

# Install prerequisites
if (-not $SkipPrerequisites) {
    Write-Host "`n=== Installing Prerequisites ===" -ForegroundColor Green
    
    $tempDir = "$env:TEMP\PermitSystemInstall"
    if (!(Test-Path $tempDir)) {
        New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
    }
    
    # Install Chocolatey (package manager for Windows)
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
    
    # Install Git
    Write-Host "Installing Git..." -ForegroundColor Yellow
    choco install git -y
    
    # Install Node.js (required for Bun installation)
    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    choco install nodejs -y
    
    # Install PostgreSQL
    Write-Host "Installing PostgreSQL..." -ForegroundColor Yellow
    if ([string]::IsNullOrEmpty($DatabasePassword)) {
        $DatabasePassword = Read-Host "Enter PostgreSQL password for 'postgres' user" -AsSecureString
        $DatabasePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DatabasePassword))
    }
    
    choco install postgresql --params "/Password:$DatabasePassword" -y
    
    # Install Visual C++ Redistributables (required for native modules)
    Write-Host "Installing Visual C++ Redistributables..." -ForegroundColor Yellow
    choco install vcredist-all -y
    
    # Install Apache (if requested)
    if ($InstallApache) {
        Write-Host "Installing Apache HTTP Server..." -ForegroundColor Yellow
        choco install apache-httpd -y
    }
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "Prerequisites installation completed!" -ForegroundColor Green
}

# Install Bun
Write-Host "`n=== Installing Bun Runtime ===" -ForegroundColor Green
if (!(Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Bun..." -ForegroundColor Yellow
    powershell -c "irm bun.sh/install.ps1 | iex"
    
    # Add Bun to PATH
    $bunPath = "$env:USERPROFILE\.bun\bin"
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$bunPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$bunPath", "User")
    }
    $env:Path += ";$bunPath"
}

# Setup PostgreSQL Database
Write-Host "`n=== Setting Up Database ===" -ForegroundColor Green

$postgresPath = "${env:ProgramFiles}\PostgreSQL\*\bin"
$psqlPath = Get-ChildItem -Path $postgresPath -Name "psql.exe" -Recurse | Select-Object -First 1
if ($psqlPath) {
    $psqlPath = (Get-ChildItem -Path $postgresPath -Name "psql.exe" -Recurse | Select-Object -First 1).FullName
    
    Write-Host "Creating database and user..." -ForegroundColor Yellow
    
    # Create database setup script
    $dbSetupScript = @"
CREATE USER permit_user WITH PASSWORD 'permit123';
CREATE DATABASE permit_system OWNER permit_user;
GRANT ALL PRIVILEGES ON DATABASE permit_system TO permit_user;
\q
"@
    
    $dbSetupFile = "$tempDir\setup_db.sql"
    $dbSetupScript | Out-File -FilePath $dbSetupFile -Encoding UTF8
    
    # Execute database setup
    $env:PGPASSWORD = $DatabasePassword
    & $psqlPath -U postgres -d postgres -f $dbSetupFile
    
    Write-Host "Database setup completed!" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL not found. Please ensure PostgreSQL is installed correctly." -ForegroundColor Red
}

# Download and setup application
Write-Host "`n=== Installing Application ===" -ForegroundColor Green

# Clone or copy application files
$appPath = "$InstallPath\app"
if (!(Test-Path $appPath)) {
    New-Item -Path $appPath -ItemType Directory -Force | Out-Null
}

# Create application files
Write-Host "Creating application configuration..." -ForegroundColor Yellow

# Create package.json
$packageJson = @"
{
  "name": "permit-management-system",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "start": "bun server/index.js",
    "dev": "bun --watch server/index.ts",
    "build": "bun build server/index.ts --outdir dist --target bun"
  },
  "dependencies": {
    "express": "^4.21.2",
    "bcryptjs": "^3.0.2",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "passport-github2": "^0.1.12",
    "express-session": "^1.18.1",
    "connect-pg-simple": "^10.0.0",
    "multer": "^2.0.1",
    "drizzle-orm": "^0.39.3",
    "pg": "^8.13.1",
    "dotenv": "^16.4.7"
  }
}
"@
$packageJson | Out-File -FilePath "$appPath\package.json" -Encoding UTF8

# Create environment file
$envContent = @"
# Database Configuration
DATABASE_URL=postgresql://permit_user:permit123@localhost:5432/permit_system

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Session Security
SESSION_SECRET=$((1..64 | ForEach {[char]((65..90) + (97..122) | Get-Random)}) -join '')

# File Upload Configuration
UPLOAD_DIR=$($InstallPath.Replace('\', '/').Replace(':', ''))/uploads
MAX_FILE_SIZE=10485760

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
"@
$envContent | Out-File -FilePath "$appPath\.env" -Encoding UTF8

# Create startup script
$startupScript = @"
@echo off
cd /d "$appPath"
echo Starting Permit Management System...
echo Database: PostgreSQL
echo Runtime: Bun
echo Port: 3000
echo Admin: admin@localhost / admin123
echo.
bun start
pause
"@
$startupScript | Out-File -FilePath "$InstallPath\start-permit-system.bat" -Encoding UTF8

# Create install service script
$serviceScript = @"
@echo off
echo Installing Permit System as Windows Service...
nssm install PermitSystem "$appPath\bun.exe" "start"
nssm set PermitSystem AppDirectory "$appPath"
nssm set PermitSystem DisplayName "Permit Management System"
nssm set PermitSystem Description "Building Permit Package Management System"
nssm set PermitSystem Start SERVICE_AUTO_START
echo Service installed! Use 'net start PermitSystem' to start.
pause
"@
$serviceScript | Out-File -FilePath "$InstallPath\install-service.bat" -Encoding UTF8

# Install dependencies
Write-Host "Installing application dependencies..." -ForegroundColor Yellow
Set-Location $appPath
bun install

# Apache configuration (if Apache is installed)
if ($InstallApache) {
    Write-Host "`n=== Configuring Apache ===" -ForegroundColor Green
    
    $apacheConfig = @"
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot "$($InstallPath.Replace('\', '/'))/public"
    
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/
    ProxyPass /auth/ http://localhost:3000/auth/
    ProxyPassReverse /auth/ http://localhost:3000/auth/
    ProxyPass /login http://localhost:3000/login
    ProxyPassReverse /login http://localhost:3000/login
    ProxyPass /dashboard http://localhost:3000/dashboard
    ProxyPassReverse /dashboard http://localhost:3000/dashboard
    ProxyPass /admin/ http://localhost:3000/admin/
    ProxyPassReverse /admin/ http://localhost:3000/admin/
    
    ErrorLog logs/permit-system_error.log
    CustomLog logs/permit-system_access.log combined
</VirtualHost>
"@
    
    $apacheConfigPath = "${env:ProgramFiles}\Apache Group\Apache2\conf\extra\permit-system.conf"
    if (Test-Path "${env:ProgramFiles}\Apache Group\Apache2\conf\extra\") {
        $apacheConfig | Out-File -FilePath $apacheConfigPath -Encoding UTF8
        Write-Host "Apache configuration created at: $apacheConfigPath" -ForegroundColor Green
        Write-Host "Add 'Include conf/extra/permit-system.conf' to httpd.conf to enable." -ForegroundColor Yellow
    }
}

# Create desktop shortcuts
Write-Host "`n=== Creating Shortcuts ===" -ForegroundColor Green

$WshShell = New-Object -comObject WScript.Shell

# Start application shortcut
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Start Permit System.lnk")
$Shortcut.TargetPath = "$InstallPath\start-permit-system.bat"
$Shortcut.WorkingDirectory = $InstallPath
$Shortcut.IconLocation = "shell32.dll,137"
$Shortcut.Description = "Start Permit Management System"
$Shortcut.Save()

# Install service shortcut
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Install Permit Service.lnk")
$Shortcut.TargetPath = "$InstallPath\install-service.bat"
$Shortcut.WorkingDirectory = $InstallPath
$Shortcut.IconLocation = "shell32.dll,21"
$Shortcut.Description = "Install Permit System as Windows Service"
$Shortcut.Save()

# Open browser shortcut
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Permit System Dashboard.lnk")
$Shortcut.TargetPath = "http://localhost:3000"
$Shortcut.IconLocation = "shell32.dll,14"
$Shortcut.Description = "Open Permit System in Browser"
$Shortcut.Save()

# Final setup
Write-Host "`n=== Final Configuration ===" -ForegroundColor Green

# Add Windows Firewall rules
Write-Host "Adding Windows Firewall rules..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Permit System HTTP" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction SilentlyContinue
if ($InstallApache) {
    New-NetFirewallRule -DisplayName "Apache HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
}

# Cleanup
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`n=== Installation Complete! ===" -ForegroundColor Green -BackgroundColor DarkGreen
Write-Host ""
Write-Host "Installation Details:" -ForegroundColor Cyan
Write-Host "  • Installation Path: $InstallPath" -ForegroundColor White
Write-Host "  • Database: PostgreSQL (permit_system)" -ForegroundColor White
Write-Host "  • Database User: permit_user / permit123" -ForegroundColor White
Write-Host "  • Runtime: Bun" -ForegroundColor White
Write-Host "  • Port: 3000" -ForegroundColor White
Write-Host ""
Write-Host "Quick Start:" -ForegroundColor Cyan
Write-Host "  1. Double-click 'Start Permit System' on desktop" -ForegroundColor White
Write-Host "  2. Open browser to: http://localhost:3000" -ForegroundColor White
Write-Host "  3. Login: admin@localhost / admin123" -ForegroundColor White
Write-Host ""
Write-Host "Optional:" -ForegroundColor Cyan
Write-Host "  • Install as Windows Service: Double-click 'Install Permit Service'" -ForegroundColor White
if ($InstallApache) {
    Write-Host "  • Apache configured for port 80 access" -ForegroundColor White
}
Write-Host ""
Write-Host "Configuration files:" -ForegroundColor Cyan
Write-Host "  • Environment: $appPath\.env" -ForegroundColor White
Write-Host "  • Logs: Check Windows Event Viewer" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit installer"
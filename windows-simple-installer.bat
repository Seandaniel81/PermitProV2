@echo off
REM Simple Windows Installer for Permit Management System
REM Run as Administrator

echo =============================================================
echo         Windows Permit Management System Installer
echo =============================================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This installer requires Administrator privileges.
    echo Please right-click and "Run as Administrator"
    pause
    exit /b 1
)

echo Checking prerequisites...

REM Set installation path
set "INSTALL_PATH=C:\PermitSystem"
set "APP_PATH=%INSTALL_PATH%\app"

REM Create directories
if not exist "%INSTALL_PATH%" mkdir "%INSTALL_PATH%"
if not exist "%APP_PATH%" mkdir "%APP_PATH%"

echo Installation directory: %INSTALL_PATH%
echo.

REM Check if Chocolatey is installed
where choco >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing Chocolatey package manager...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    
    REM Refresh PATH
    call refreshenv
)

echo Installing required software...
echo.

REM Install Git
echo Installing Git...
choco install git -y

REM Install Node.js
echo Installing Node.js...
choco install nodejs -y

REM Install PostgreSQL
echo Installing PostgreSQL...
set /p DB_PASSWORD="Enter password for PostgreSQL 'postgres' user: "
choco install postgresql --params "/Password:%DB_PASSWORD%" -y

REM Install Visual C++ Redistributables
echo Installing Visual C++ Redistributables...
choco install vcredist-all -y

REM Refresh environment
call refreshenv

REM Install Bun
echo Installing Bun runtime...
powershell -c "irm bun.sh/install.ps1 | iex"

REM Add Bun to PATH for current session
set "PATH=%PATH%;%USERPROFILE%\.bun\bin"

REM Setup PostgreSQL Database
echo.
echo Setting up database...

REM Find PostgreSQL installation
for /d %%i in ("%ProgramFiles%\PostgreSQL\*") do set "POSTGRES_PATH=%%i\bin"

if exist "%POSTGRES_PATH%\psql.exe" (
    echo Creating database and user...
    
    REM Create temporary SQL file
    echo CREATE USER permit_user WITH PASSWORD 'permit123'; > "%TEMP%\setup_db.sql"
    echo CREATE DATABASE permit_system OWNER permit_user; >> "%TEMP%\setup_db.sql"
    echo GRANT ALL PRIVILEGES ON DATABASE permit_system TO permit_user; >> "%TEMP%\setup_db.sql"
    
    REM Execute database setup
    set PGPASSWORD=%DB_PASSWORD%
    "%POSTGRES_PATH%\psql.exe" -U postgres -d postgres -f "%TEMP%\setup_db.sql"
    
    del "%TEMP%\setup_db.sql"
    echo Database setup completed!
) else (
    echo Warning: PostgreSQL installation not found. Please verify installation.
)

REM Create application files
echo.
echo Creating application...

REM Create package.json
echo { > "%APP_PATH%\package.json"
echo   "name": "permit-management-system", >> "%APP_PATH%\package.json"
echo   "version": "2.0.0", >> "%APP_PATH%\package.json"
echo   "type": "module", >> "%APP_PATH%\package.json"
echo   "scripts": { >> "%APP_PATH%\package.json"
echo     "start": "bun server/index.js", >> "%APP_PATH%\package.json"
echo     "dev": "bun --watch server/index.ts" >> "%APP_PATH%\package.json"
echo   }, >> "%APP_PATH%\package.json"
echo   "dependencies": { >> "%APP_PATH%\package.json"
echo     "express": "^4.21.2", >> "%APP_PATH%\package.json"
echo     "bcryptjs": "^3.0.2", >> "%APP_PATH%\package.json"
echo     "passport": "^0.7.0", >> "%APP_PATH%\package.json"
echo     "passport-local": "^1.0.0", >> "%APP_PATH%\package.json"
echo     "express-session": "^1.18.1", >> "%APP_PATH%\package.json"
echo     "pg": "^8.13.1" >> "%APP_PATH%\package.json"
echo   } >> "%APP_PATH%\package.json"
echo } >> "%APP_PATH%\package.json"

REM Create environment file
echo # Database Configuration > "%APP_PATH%\.env"
echo DATABASE_URL=postgresql://permit_user:permit123@localhost:5432/permit_system >> "%APP_PATH%\.env"
echo. >> "%APP_PATH%\.env"
echo # Server Configuration >> "%APP_PATH%\.env"
echo NODE_ENV=production >> "%APP_PATH%\.env"
echo PORT=3000 >> "%APP_PATH%\.env"
echo HOST=0.0.0.0 >> "%APP_PATH%\.env"
echo. >> "%APP_PATH%\.env"
echo # Session Security >> "%APP_PATH%\.env"
echo SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM% >> "%APP_PATH%\.env"

REM Create startup script
echo @echo off > "%INSTALL_PATH%\start-permit-system.bat"
echo cd /d "%APP_PATH%" >> "%INSTALL_PATH%\start-permit-system.bat"
echo echo Starting Permit Management System... >> "%INSTALL_PATH%\start-permit-system.bat"
echo echo Database: PostgreSQL >> "%INSTALL_PATH%\start-permit-system.bat"
echo echo Runtime: Bun >> "%INSTALL_PATH%\start-permit-system.bat"
echo echo Port: 3000 >> "%INSTALL_PATH%\start-permit-system.bat"
echo echo Admin Login: admin@localhost / admin123 >> "%INSTALL_PATH%\start-permit-system.bat"
echo echo. >> "%INSTALL_PATH%\start-permit-system.bat"
echo echo Open browser to: http://localhost:3000 >> "%INSTALL_PATH%\start-permit-system.bat"
echo echo. >> "%INSTALL_PATH%\start-permit-system.bat"
echo bun start >> "%INSTALL_PATH%\start-permit-system.bat"
echo pause >> "%INSTALL_PATH%\start-permit-system.bat"

REM Install dependencies
echo Installing application dependencies...
cd /d "%APP_PATH%"
bun install

REM Create desktop shortcuts
echo Creating desktop shortcuts...

REM Create VBS script to create shortcuts
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_shortcuts.vbs"
echo sLinkFile = "%USERPROFILE%\Desktop\Start Permit System.lnk" >> "%TEMP%\create_shortcuts.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\create_shortcuts.vbs"
echo oLink.TargetPath = "%INSTALL_PATH%\start-permit-system.bat" >> "%TEMP%\create_shortcuts.vbs"
echo oLink.WorkingDirectory = "%INSTALL_PATH%" >> "%TEMP%\create_shortcuts.vbs"
echo oLink.Description = "Start Permit Management System" >> "%TEMP%\create_shortcuts.vbs"
echo oLink.Save >> "%TEMP%\create_shortcuts.vbs"

cscript "%TEMP%\create_shortcuts.vbs" //nologo
del "%TEMP%\create_shortcuts.vbs"

REM Add Windows Firewall rules
echo Adding Windows Firewall rules...
netsh advfirewall firewall add rule name="Permit System HTTP" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1

echo.
echo =============================================================
echo                 INSTALLATION COMPLETE!
echo =============================================================
echo.
echo Installation Details:
echo   Installation Path: %INSTALL_PATH%
echo   Database: PostgreSQL (permit_system)
echo   Database User: permit_user / permit123
echo   Runtime: Bun
echo   Port: 3000
echo.
echo Quick Start:
echo   1. Double-click "Start Permit System" on desktop
echo   2. Open browser to: http://localhost:3000
echo   3. Login: admin@localhost / admin123
echo.
echo Configuration:
echo   Environment: %APP_PATH%\.env
echo   Startup Script: %INSTALL_PATH%\start-permit-system.bat
echo.
echo The system is now ready to use!
echo.
pause
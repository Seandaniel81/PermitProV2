#!/bin/bash

set -e

echo "🏗️  Installing Permit Management System with Bun Runtime"
echo "========================================================"

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun runtime..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    # Try to source shell profiles
    [ -f ~/.bashrc ] && source ~/.bashrc || true
    [ -f ~/.zshrc ] && source ~/.zshrc || true
    
    if ! command -v bun &> /dev/null; then
        echo "❌ Bun installation failed. Please install manually from https://bun.sh"
        exit 1
    fi
fi

echo "✅ Bun found: $(bun --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    exit 1
fi

echo "✅ PostgreSQL found: $(psql --version)"

# Install dependencies
echo "📦 Installing dependencies with Bun..."
bun install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads logs backups

# Setup environment if .env doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment configuration..."
    
    # Generate secure session secret
    SESSION_SECRET=$(openssl rand -hex 32)
    
    # Prompt for database URL
    read -p "Enter your PostgreSQL connection string (e.g., postgresql://user:pass@localhost:5432/permits_db): " DATABASE_URL
    
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL is required"
        exit 1
    fi
    
    # Create .env file
    cat > .env << EOF
# Database Configuration
DATABASE_URL=${DATABASE_URL}

# Authentication Configuration  
SESSION_SECRET=${SESSION_SECRET}

# OpenID Connect Configuration - Google OAuth
OIDC_ISSUER_URL=https://accounts.google.com
OIDC_CLIENT_ID=625523063326-hnq3mak1r35pfv739fa7ppcekthqas0a.apps.googleusercontent.com
OIDC_CLIENT_SECRET=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
OIDC_REDIRECT_URI=http://localhost:5000/api/callback
ALLOWED_DOMAINS=localhost,swonger.tplinkdns.com

# Application Settings
NODE_ENV=production
PORT=5000

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Auto-approve users (set to true for development)
AUTO_APPROVE_USERS=true
EOF
    
    echo "✅ Environment configuration created"
else
    echo "✅ Using existing .env configuration"
fi

echo "✅ DATABASE_URL configured"

# Build the application
echo "🔨 Building application with Bun..."
bun run build

# Setup database
echo "🗄️  Setting up database..."
if [ -f scripts/setup-database.ts ]; then
    bun run scripts/setup-database.ts
else
    echo "⚠️  Database setup script not found. Please run 'bun run db:push' manually after installation."
fi

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "🎉 Your permit management system is ready!"
echo ""
echo "Next steps:"
echo "1. Review and customize settings in the application"
echo "2. Configure SSL certificates for production"
echo "3. Set up reverse proxy (nginx/Apache)"
echo "4. Start the application: bun start"
echo ""
echo "For production deployment with PM2:"
echo "  bun install -g pm2"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save && pm2 startup"
echo ""
echo "For development:"
echo "  bun run dev"
echo ""
echo "The application will be available at: http://localhost:5000"
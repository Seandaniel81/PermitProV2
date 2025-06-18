#!/bin/bash

# Apache2 Setup Script for Permit Management System
# This script configures Apache2 as a reverse proxy for the Node.js application

set -e

echo "🚀 Setting up Apache2 for Permit Management System..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root or with sudo"
    exit 1
fi

# Update package list
echo "📦 Updating package list..."
apt update

# Install Apache2 and required modules
echo "🔧 Installing Apache2 and modules..."
apt install -y apache2

# Enable required Apache modules
echo "⚙️ Enabling Apache modules..."
a2enmod rewrite
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod ssl
a2enmod headers
a2enmod expires
a2enmod deflate

# Install mod_evasive for DDoS protection (optional)
echo "🛡️ Installing mod_evasive for security..."
apt install -y libapache2-mod-evasive || echo "⚠️ mod_evasive not available, skipping..."
if [ -f /etc/apache2/mods-available/evasive.load ]; then
    a2enmod evasive
fi

# Create log directory for mod_evasive
mkdir -p /var/log/apache2/evasive
chown www-data:www-data /var/log/apache2/evasive

# Backup default Apache configuration
echo "💾 Backing up default configuration..."
cp /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf.backup

# Create directory for the application
echo "📁 Creating application directory..."
mkdir -p /var/www/html/permit-tracker
chown -R www-data:www-data /var/www/html/permit-tracker

# Copy the configuration file
echo "📋 Setting up virtual host configuration..."
if [ -f "apache2.conf" ]; then
    cp apache2.conf /etc/apache2/sites-available/permit-tracker.conf
else
    echo "❌ apache2.conf file not found in current directory"
    exit 1
fi

# Get domain name from user
read -p "🌐 Enter your domain name (e.g., yourdomain.com): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME="localhost"
    echo "⚠️ No domain provided, using localhost"
fi

# Update configuration with actual domain
sed -i "s/your-domain.com/$DOMAIN_NAME/g" /etc/apache2/sites-available/permit-tracker.conf

# SSL Certificate setup
echo "🔒 SSL Certificate Setup"
echo "Choose an option:"
echo "1) Use Let's Encrypt (Certbot) - Recommended for production"
echo "2) Use self-signed certificate - For development/testing"
echo "3) Skip SSL setup - I'll configure it later"
read -p "Enter your choice (1-3): " SSL_CHOICE

case $SSL_CHOICE in
    1)
        echo "📜 Installing Certbot..."
        apt install -y snapd
        snap install core; snap refresh core
        snap install --classic certbot
        ln -sf /snap/bin/certbot /usr/bin/certbot
        
        echo "🔐 Generating Let's Encrypt certificate..."
        echo "Note: Make sure your domain points to this server before continuing"
        read -p "Press Enter when ready to continue..."
        
        certbot certonly --apache -d $DOMAIN_NAME -d www.$DOMAIN_NAME
        
        # Update config with Let's Encrypt paths
        sed -i "s|/etc/ssl/certs/your-domain.crt|/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem|g" /etc/apache2/sites-available/permit-tracker.conf
        sed -i "s|/etc/ssl/private/your-domain.key|/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem|g" /etc/apache2/sites-available/permit-tracker.conf
        sed -i "s|/etc/ssl/certs/your-domain-chain.crt|/etc/letsencrypt/live/$DOMAIN_NAME/chain.pem|g" /etc/apache2/sites-available/permit-tracker.conf
        ;;
    2)
        echo "🔐 Generating self-signed certificate..."
        mkdir -p /etc/ssl/private /etc/ssl/certs
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/ssl/private/$DOMAIN_NAME.key \
            -out /etc/ssl/certs/$DOMAIN_NAME.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$DOMAIN_NAME"
        
        # Update config with self-signed paths
        sed -i "s|/etc/ssl/certs/your-domain.crt|/etc/ssl/certs/$DOMAIN_NAME.crt|g" /etc/apache2/sites-available/permit-tracker.conf
        sed -i "s|/etc/ssl/private/your-domain.key|/etc/ssl/private/$DOMAIN_NAME.key|g" /etc/apache2/sites-available/permit-tracker.conf
        sed -i "s|SSLCertificateChainFile.*||g" /etc/apache2/sites-available/permit-tracker.conf
        ;;
    3)
        echo "⏭️ Skipping SSL setup"
        # Comment out SSL configuration
        sed -i 's/^SSLEngine/#SSLEngine/g' /etc/apache2/sites-available/permit-tracker.conf
        sed -i 's/^SSLCertificate/#SSLCertificate/g' /etc/apache2/sites-available/permit-tracker.conf
        sed -i 's/^SSLProtocol/#SSLProtocol/g' /etc/apache2/sites-available/permit-tracker.conf
        sed -i 's/^SSLCipher/#SSLCipher/g' /etc/apache2/sites-available/permit-tracker.conf
        sed -i 's/^SSLHonor/#SSLHonor/g' /etc/apache2/sites-available/permit-tracker.conf
        sed -i 's/^SSLSession/#SSLSession/g' /etc/apache2/sites-available/permit-tracker.conf
        ;;
esac

# Enable the site
echo "✅ Enabling the permit-tracker site..."
a2ensite permit-tracker.conf

# Disable default site (optional)
read -p "🚫 Disable default Apache site? (y/N): " DISABLE_DEFAULT
if [ "$DISABLE_DEFAULT" = "y" ] || [ "$DISABLE_DEFAULT" = "Y" ]; then
    a2dissite 000-default
fi

# Test Apache configuration
echo "🧪 Testing Apache configuration..."
apache2ctl configtest

if [ $? -eq 0 ]; then
    echo "✅ Apache configuration is valid"
else
    echo "❌ Apache configuration has errors. Please check the configuration."
    exit 1
fi

# Create systemd service for the Node.js application
echo "⚙️ Creating systemd service for the application..."
cat > /etc/systemd/system/permit-tracker.service << EOF
[Unit]
Description=Permit Management System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/permit-tracker
Environment=NODE_ENV=production
Environment=PORT=5000
ExecStart=/usr/bin/bun run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable the service
systemctl daemon-reload
systemctl enable permit-tracker.service

# Configure firewall (if ufw is installed)
if command -v ufw &> /dev/null; then
    echo "🔥 Configuring firewall..."
    ufw allow 'Apache Full'
    echo "✅ Firewall configured for Apache"
fi

# Restart Apache
echo "🔄 Restarting Apache..."
systemctl restart apache2

# Check Apache status
if systemctl is-active --quiet apache2; then
    echo "✅ Apache is running successfully"
else
    echo "❌ Apache failed to start. Check logs with: journalctl -u apache2"
    exit 1
fi

echo ""
echo "🎉 Apache2 setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy your application to: /var/www/html/permit-tracker"
echo "2. Install Node.js and Bun if not already installed"
echo "3. Start the application service: systemctl start permit-tracker"
echo "4. Check application status: systemctl status permit-tracker"
echo ""
echo "🌐 Your site should be accessible at:"
if [ "$SSL_CHOICE" != "3" ]; then
    echo "   https://$DOMAIN_NAME"
else
    echo "   http://$DOMAIN_NAME"
fi
echo ""
echo "📊 Monitor logs:"
echo "   Apache: tail -f /var/log/apache2/permit-tracker-*.log"
echo "   Application: journalctl -u permit-tracker -f"
echo ""
echo "🔧 Useful commands:"
echo "   systemctl restart permit-tracker  # Restart application"
echo "   systemctl restart apache2         # Restart Apache"
echo "   apache2ctl configtest             # Test configuration"
#!/bin/bash

# Installation Verification Script for Permit Management System

echo "Verifying Permit Management System Installation..."
echo "================================================"

# Check if required files exist
echo "1. Checking required files..."
if [ -f "permit_system.db" ]; then
    echo "   ✓ SQLite database found"
else
    echo "   ✗ SQLite database missing"
    exit 1
fi

if [ -f ".env" ]; then
    echo "   ✓ Environment configuration found"
else
    echo "   ✗ Environment configuration missing"
    exit 1
fi

if [ -d "uploads" ]; then
    echo "   ✓ Upload directory found"
else
    echo "   ✗ Upload directory missing"
    exit 1
fi

# Check database contents
echo "2. Verifying database setup..."
ADMIN_COUNT=$(sqlite3 permit_system.db "SELECT COUNT(*) FROM users WHERE email='admin@localhost';" 2>/dev/null || echo "0")
if [ "$ADMIN_COUNT" = "1" ]; then
    echo "   ✓ Admin user exists in database"
else
    echo "   ✗ Admin user not found in database"
    exit 1
fi

# Check if Node.js server is running
echo "3. Checking application server..."
if curl -s http://localhost:5000/api/login > /dev/null 2>&1; then
    echo "   ✓ Application server is running on port 5000"
else
    echo "   ✗ Application server not responding on port 5000"
    echo "   → Start with: npm run dev"
fi

# Test authentication
echo "4. Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"admin123"}' 2>/dev/null)

if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
    echo "   ✓ Authentication working correctly"
else
    echo "   ✗ Authentication failed"
    echo "   Response: $AUTH_RESPONSE"
fi

# Check Apache configuration
echo "5. Checking Apache configuration..."
if sudo apache2ctl configtest > /dev/null 2>&1; then
    echo "   ✓ Apache configuration is valid"
else
    echo "   ⚠ Apache configuration has issues"
fi

if curl -s http://localhost/api/login > /dev/null 2>&1; then
    echo "   ✓ Apache proxy is working"
else
    echo "   ⚠ Apache proxy not responding (may not be configured)"
fi

echo ""
echo "Verification Complete!"
echo "====================="
echo ""
echo "Access the system at:"
echo "  Direct: http://localhost:5000/api/login"
echo "  Apache: http://localhost/api/login"
echo ""
echo "Login credentials:"
echo "  Email: admin@localhost"
echo "  Password: admin123"
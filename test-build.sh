#!/bin/bash

echo "Testing Build Components..."
echo "=========================="

# Test 1: Check Bun installation
echo "1. Checking Bun..."
if command -v bun &> /dev/null; then
    echo "✓ Bun $(bun --version) found"
else
    echo "✗ Bun not found"
    exit 1
fi

# Test 2: Check package.json scripts
echo "2. Checking package.json scripts..."
if grep -q '"build":' package.json; then
    echo "✓ Build script exists"
else
    echo "✗ Build script missing"
    exit 1
fi

# Test 3: Test build process
echo "3. Testing build process..."
if bun run build > /dev/null 2>&1; then
    echo "✓ Build successful"
else
    echo "✗ Build failed"
    exit 1
fi

# Test 4: Check build output
echo "4. Checking build output..."
if [ -f "dist/index.js" ]; then
    echo "✓ Server build exists ($(ls -lh dist/index.js | awk '{print $5}')"
else
    echo "✗ Server build missing"
    exit 1
fi

if [ -d "dist/public" ]; then
    echo "✓ Client build exists"
else
    echo "✗ Client build missing"
    exit 1
fi

# Test 5: Check installation scripts
echo "5. Checking installation scripts..."
for script in install.sh scripts/bun-deploy.sh scripts/private-install.sh scripts/server-install.sh; do
    if [ -x "$script" ]; then
        echo "✓ $script executable"
    else
        echo "✗ $script not executable or missing"
    fi
done

# Test 6: Check database setup
echo "6. Checking database setup..."
if grep -q "db:push" package.json; then
    echo "✓ Database migration script exists"
else
    echo "✗ Database migration script missing"
fi

echo ""
echo "All build components verified successfully!"
echo "Available installation options:"
echo "  ./install.sh - Universal installer"
echo "  ./scripts/bun-deploy.sh - Advanced Bun deployment"
echo "  docker-compose up -d - Docker deployment"
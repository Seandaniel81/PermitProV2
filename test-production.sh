#!/bin/bash

echo "Testing production server startup..."

# Kill any existing production processes
pkill -f "node dist/index.js" 2>/dev/null || true

# Create production environment
export NODE_ENV=production
export PORT=3001
export DATABASE_URL=file:./permit_system.db
export SESSION_SECRET=prod-test-secret
export USE_DEV_AUTH=true
export FORCE_LOCAL_AUTH=true
export AUTO_APPROVE_USERS=true

# Start production server in background
echo "Starting production server on port 3001..."
node dist/index.js > production-test.log 2>&1 &
PROD_PID=$!

# Wait for server to start
sleep 5

# Test if server is responding
if curl -s http://localhost:3001 > /dev/null; then
    echo "✓ Production server started successfully on port 3001"
    echo "✓ Server is responding to requests"
    
    # Test a quick request
    echo "Testing server response..."
    curl -s http://localhost:3001 | head -5
    
    # Clean up
    kill $PROD_PID 2>/dev/null || true
    echo "✓ Production server test completed"
else
    echo "✗ Production server failed to start"
    echo "Check production-test.log for errors:"
    cat production-test.log
    kill $PROD_PID 2>/dev/null || true
    exit 1
fi
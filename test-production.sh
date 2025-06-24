#!/bin/bash
echo "Checking production server..."
timeout 10s ./deploy-production.sh || echo "Deployment script timed out"
#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Starting Automated Deployment"
echo "=========================================="

# Pull latest commits
echo "--> Pulling latest code from GitHub main..."
git pull origin main

# Backend Deployment
echo "--> Deploying Backend..."
cd backend
npm install --production
pm2 restart all || pm2 start src/server.js --name "silaiwala-backend"

# Frontend Deployment
echo "--> Building Frontend..."
cd ../frontend
npm install
NODE_OPTIONS="--max-old-space-size=2048" npm run build

echo "=========================================="
echo "✅ Deployment Successful & Live!"
echo "=========================================="

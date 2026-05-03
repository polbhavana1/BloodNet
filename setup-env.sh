#!/bin/bash

# BloodNet+ Environment Setup Script
echo "🩸 Setting up BloodNet+ Environment Variables..."

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "📋 Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please update backend/.env with your actual values"
else
    echo "✅ Backend .env file already exists"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📋 Creating frontend .env file..."
    cp frontend/.env.example frontend/.env
    echo "⚠️  Please update frontend/.env with your actual values"
else
    echo "✅ Frontend .env file already exists"
fi

echo ""
echo "🔑 Required Setup Steps:"
echo "1. Get Google Maps API Key: https://console.cloud.google.com/"
echo "2. Generate JWT Secret: openssl rand -base64 32"
echo "3. Setup MongoDB: mongodb://localhost:27017/bloodnet"
echo ""
echo "📝 Files to edit:"
echo "- backend/.env"
echo "- frontend/.env"
echo ""
echo "🚀 After setup, run:"
echo "- Backend: cd backend && npm start"
echo "- Frontend: cd frontend && npm start"

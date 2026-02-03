#!/bin/bash

echo "🚀 PulseLogic - Quick Setup Script"
echo "=================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start database services
echo "🐳 Starting database services..."
docker-compose up -d

echo "⏳ Waiting for databases to be ready..."
sleep 5

echo "✅ Databases started"
echo ""

# Backend setup
echo "📦 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

echo "📦 Installing backend dependencies..."
npm install

echo "✅ Backend setup complete"
echo ""

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend

if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete"
echo ""

# Final instructions
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Review and update backend/.env with your configuration"
echo "2. Run database migrations: cd backend && npm run migration:run"
echo "3. Start backend: cd backend && npm run start:dev"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""
echo "Access the application at: http://localhost:3000"
echo ""

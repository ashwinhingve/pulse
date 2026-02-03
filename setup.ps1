# PulseLogic - Quick Setup Script (Windows)

Write-Host "🚀 PulseLogic - Quick Setup Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Start database services
Write-Host "🐳 Starting database services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "⏳ Waiting for databases to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "✅ Databases started" -ForegroundColor Green
Write-Host ""

# Backend setup
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit backend\.env with your configuration" -ForegroundColor Yellow
}

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "✅ Backend setup complete" -ForegroundColor Green
Write-Host ""

# Frontend setup
Write-Host "📦 Setting up frontend..." -ForegroundColor Yellow
Set-Location ../frontend

if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    Copy-Item .env.example .env.local
}

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "✅ Frontend setup complete" -ForegroundColor Green
Write-Host ""

# Return to root
Set-Location ..

# Final instructions
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review and update backend\.env with your configuration"
Write-Host "2. Run database migrations: cd backend && npm run migration:run"
Write-Host "3. Start backend: cd backend && npm run start:dev"
Write-Host "4. Start frontend: cd frontend && npm run dev"
Write-Host ""
Write-Host "Access the application at: http://localhost:3000" -ForegroundColor Green
Write-Host ""

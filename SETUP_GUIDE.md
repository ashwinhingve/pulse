
# PulseLogic - Development Setup Guide

## ⚠️ Docker Desktop Issue

**Error**: `The system cannot find the file specified` when running `docker-compose up -d`

**Cause**: Docker Desktop is not running on your Windows machine.

**Solution**:

### Option 1: Start Docker Desktop (Recommended)

1. **Install Docker Desktop** (if not installed):
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and restart your computer

2. **Start Docker Desktop**:
   - Open Docker Desktop from Start Menu
   - Wait for it to fully start (whale icon in system tray should be steady)
   - Run: `docker-compose up -d`

### Option 2: Use Cloud Databases (Alternative)

If you don't want to use Docker, you can use cloud databases:

**PostgreSQL Options**:
- Supabase (free tier): https://supabase.com
- ElephantSQL (free tier): https://www.elephantsql.com
- Neon (free tier): https://neon.tech

**Redis Options**:
- Upstash (free tier): https://upstash.com
- Redis Cloud (free tier): https://redis.com/try-free/

Update `backend/.env` with your cloud database credentials.

---

## 🚀 Quick Setup (After Docker is Running)

### 1. Start Docker Services

```powershell
# Make sure Docker Desktop is running first!
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Backend Setup

```powershell
cd backend

# Create .env file
Copy-Item .env.example .env

# Edit .env and update:
# - JWT_SECRET (generate random string)
# - JWT_REFRESH_SECRET (generate different random string)
# - ENCRYPTION_KEY (generate random base64 string)

# Install dependencies
npm install

# Start development server
npm run start:dev
```

**Backend should run on**: http://localhost:3001

### 3. Frontend Setup

```powershell
cd frontend

# Create .env.local file
Copy-Item .env.example .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend should run on**: http://localhost:3000

---

## 🔧 Troubleshooting

### Frontend Errors

**Error**: `Module not found: Can't resolve 'next-themes'`
```powershell
cd frontend
npm install next-themes tailwindcss-animate
```

**Error**: `Cannot find module '@/...'`
- Make sure `tsconfig.json` has correct paths configuration
- Restart the dev server

### Backend Errors

**Error**: `Cannot connect to database`
- Make sure Docker containers are running: `docker-compose ps`
- Check `.env` file has correct database credentials
- Default: `DB_HOST=localhost`, `DB_PORT=5432`

**Error**: `Module not found`
```powershell
cd backend
npm install
```

### Docker Errors

**Error**: `Cannot connect to Docker daemon`
- Start Docker Desktop
- Wait for it to fully initialize

**Error**: `Port already in use`
```powershell
# Stop existing containers
docker-compose down

# Start again
docker-compose up -d
```

---

## 📝 Generate Secure Secrets

For production, generate secure secrets:

```powershell
# PowerShell - Generate random secrets
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Update these in `backend/.env`:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY` (base64 encoded)

---

## ✅ Verify Setup

### Check Backend

```powershell
# Should return: {"message":"OK"}
curl http://localhost:3001/api/health
```

### Check Frontend

Open browser: http://localhost:3000
- Should redirect to login page
- Login page should load without errors

### Check Database

```powershell
# Connect to PostgreSQL
docker exec -it pulselogic-postgres psql -U pulselogic -d pulselogic_dev

# List tables (after migrations)
\dt

# Exit
\q
```

---

## 🎯 Next Steps

1. ✅ Start Docker Desktop
2. ✅ Run `docker-compose up -d`
3. ✅ Setup backend (install deps, create .env)
4. ✅ Setup frontend (install deps, create .env.local)
5. ✅ Start both dev servers
6. ✅ Access http://localhost:3000

---

## 📞 Need Help?

Common issues and solutions are in this guide. If you encounter other errors:

1. Check Docker Desktop is running
2. Verify all dependencies are installed (`npm install`)
3. Check `.env` files are configured correctly
4. Restart dev servers
5. Clear `node_modules` and reinstall if needed

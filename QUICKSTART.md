# 🚀 Quick Start - PulseLogic Development

## ⚠️ IMPORTANT: Docker Desktop Required

**Before running any commands, make sure Docker Desktop is installed and running!**

### Step 1: Start Docker Desktop

1. Open **Docker Desktop** from your Start Menu
2. Wait for the whale icon in system tray to be steady (not animated)
3. Verify it's running: `docker --version`

If not installed: https://www.docker.com/products/docker-desktop/

---

## 🎯 Quick Setup Commands

### Option A: Automated Setup (Recommended)

```powershell
# Run the setup script
.\setup.ps1
```

### Option B: Manual Setup

```powershell
# 1. Start databases
docker-compose up -d

# 2. Backend setup
cd backend
npm install
# .env file is already created with defaults

# 3. Frontend setup  
cd ../frontend
npm install
# .env.local file is already created

# 4. Start backend (Terminal 1)
cd backend
npm run start:dev

# 5. Start frontend (Terminal 2)
cd frontend
npm run dev
```

---

## ✅ Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

---

## 🔧 Common Issues

### "Cannot find file dockerDesktopLinuxEngine"
**Solution**: Start Docker Desktop and wait for it to fully initialize

### "Port already in use"
```powershell
# Stop existing containers
docker-compose down

# Start again
docker-compose up -d
```

### Frontend won't start
```powershell
cd frontend
rm -r node_modules
npm install
npm run dev
```

### Backend won't start
```powershell
cd backend
rm -r node_modules
npm install
npm run start:dev
```

---

## 📚 Full Documentation

See **[SETUP_GUIDE.md](file:///d:/Do%20Not%20Open/New%20folder/SETUP_GUIDE.md)** for detailed troubleshooting and cloud database alternatives.

---

## 🎉 You're Ready!

Once both servers are running:
1. Open http://localhost:3000
2. You'll see the login page
3. Use test credentials from README.md (development only)

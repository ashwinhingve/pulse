# PulseLogic MVP - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 18+
- Docker Desktop (running)
- Git

### Step 1: Start Database
```powershell
docker-compose up -d
```

### Step 2: Start Backend
```powershell
cd backend
npm install
npm run start:dev
```
**Expected:** Server on http://localhost:3001

### Step 3: Start Frontend
```powershell
cd frontend
npm install
npm run dev
```
**Expected:** App on http://localhost:3000

---

## 📱 Mobile Build (Capacitor)

### Build for Mobile
```powershell
cd frontend
npm run mobile:build
```

### Open in Xcode (iOS)
```powershell
npm run mobile:ios
```

### Open in Android Studio
```powershell
npm run mobile:android
```

---

## 🔐 Test Credentials

Create via backend API:
```powershell
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "username": "testdoc",
    "password": "Test123!",
    "role": "doctor",
    "clearanceLevel": 2
  }'
```

---

## 🤖 AI Features (Demo)

To enable Gemini AI:
1. Get API key from https://makersuite.google.com/app/apikey
2. Update `backend/.env`: `GEMINI_API_KEY=your_key_here`
3. Restart backend

**Note:** AI is server-side only with anonymization layer.

---

## 📊 Architecture

```
CLIENT (Mobile/Desktop)
  ↓ HTTPS
SERVER (Auth + AI Gateway)
  ↓ Anonymized
AI + DATA LAYER
```

**Security:**
- ✅ Zero-trust API
- ✅ Role + Clearance based access
- ✅ PII/PHI anonymization
- ✅ Audit logging
- ✅ Rate limiting

---

## 🛠️ Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run mobile:build` | Build + sync mobile |
| `npm run mobile:ios` | Open iOS project |
| `npm run mobile:android` | Open Android project |

---

## ⚠️ Important Notes

1. **MVP Demo** - Not production-ready
2. **Change all secrets** before deployment
3. **DB_SYNCHRONIZE=false** in production
4. **AI is decision support only** - not diagnosis
5. **No patient identity to AI** - enforced by anonymization

---

## 📞 Troubleshooting

**Docker not running:**
```powershell
# Start Docker Desktop, then:
docker-compose up -d
```

**Port conflicts:**
```powershell
# Kill process on port
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Build errors:**
```powershell
# Clean install
rm -r node_modules
npm install
```

---

**Built for military medical professionals with security-first design.**

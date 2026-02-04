# PulseLogic - Secure Medical Decision Support

A secure medical decision-support system with role-based access control, AI-powered diagnostics, and multi-platform support.

## Live Demo

- **Backend API**: https://pulse-production-9a76.up.railway.app
- **Health Check**: https://pulse-production-9a76.up.railway.app/health

## Features

- Role-Based Access Control (Admin, Doctor, Medic)
- Clearance-Based Access (UNCLASSIFIED, CONFIDENTIAL, SECRET)
- AI-Powered Symptom Analysis
- ECG Interpretation Support
- Real-time Chat with WebSocket
- Multi-Factor Authentication (TOTP)
- Audit Logging
- Mobile App (Android/iOS via Capacitor)

## Demo Credentials

```
Admin:
  Username: admin
  Password: Admin123!
  Role: admin
  Clearance: SECRET

Doctor:
  Username: dr.smith
  Password: Doctor123!
  Role: doctor
  Clearance: SECRET

Medic:
  Username: medic.jones
  Password: Medic123!
  Role: medic
  Clearance: CONFIDENTIAL
```

## Project Structure

```
pulse/
├── backend/           # NestJS API server
│   ├── src/
│   │   ├── auth/      # Authentication & JWT
│   │   ├── users/     # User management
│   │   ├── ai/        # AI service (Gemini)
│   │   ├── chat/      # WebSocket chat
│   │   ├── medical/   # Medical cases
│   │   ├── audit/     # Audit logging
│   │   └── demo/      # Demo data seeding
│   └── railway.json   # Railway deployment config
├── frontend/          # Next.js + Capacitor
│   ├── app/           # App Router pages
│   ├── android/       # Android project
│   ├── lib/           # Utilities & API client
│   └── capacitor.config.ts
└── docker-compose.yml # Local PostgreSQL & Redis
```

## Local Development

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL/Redis)

### Setup

```bash
# Start database services
docker-compose up -d

# Backend
cd backend
cp .env.example .env
npm install
npm run start:dev

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Access at http://localhost:3000

## Mobile Build (Android)

### Prerequisites

- Android Studio
- Java 17+

### Build Steps

```bash
cd frontend

# Copy mobile environment
cp .env.mobile .env.local

# Install dependencies
npm install

# Build static export
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Select device/emulator
3. Click Run (green play button)

### Generate APK

In Android Studio:
1. Build > Build Bundle(s) / APK(s) > Build APK(s)
2. APK will be in `android/app/build/outputs/apk/debug/`

## Backend Deployment (Railway)

The backend is deployed on Railway with PostgreSQL.

### Environment Variables (Railway)

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
DB_SSL=true
GEMINI_API_KEY=<your-gemini-key>
```

### Deploy Commands

```bash
cd backend
railway up
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get profile

### AI Services
- `POST /api/ai/analyze-symptoms` - Symptom analysis
- `POST /api/ai/analyze-ecg` - ECG interpretation
- `POST /api/ai/query-protocol` - Protocol queries

### Users (Admin)
- `GET /api/users` - List users
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Demo
- `POST /api/demo/seed` - Seed demo data
- `DELETE /api/demo/clear` - Clear demo data

## Tech Stack

**Backend**
- NestJS 10
- TypeORM + PostgreSQL
- Socket.io
- Passport JWT
- Google Gemini AI

**Frontend**
- Next.js 14 (Static Export)
- Capacitor 7
- Tailwind CSS
- Zustand

**Deployment**
- Railway (Backend + PostgreSQL)
- Capacitor (Android/iOS)

## Disclaimers

> **MVP Notice**: This is a demonstration MVP. Not for production clinical use without proper security audit, compliance certification, and legal review.

> **AI Disclaimer**: AI features provide decision support only, not diagnosis. All outputs must be reviewed by qualified medical professionals.

## License

UNLICENSED - Proprietary software.

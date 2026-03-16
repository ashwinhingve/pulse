# PulseLogic — Secure Military Medical Decision Support

A secure, multi-platform medical decision-support system with role-based access control,
clearance-level gating, AI-powered diagnostics, and offline-capable mobile/desktop clients.

---

## Team Workflow (Read This First)

> **Team Leader:** All contributors must follow this workflow without exception.
> This keeps the codebase clean and prevents conflicts.

### Step 1 — Always Pull Before You Start

Never start working on stale code. Pull the latest changes from GitHub first.

```bash
git checkout main
git pull origin main
```

If you are working on a feature, create a branch off main:

```bash
git checkout -b feature/your-feature-name
```

### Step 2 — Set Up Your Environment

**Backend:**
```bash
cd backend
cp .env.example .env        # fill in secrets (ask team lead for values)
npm install
```

**Frontend:**
```bash
cd frontend
cp env/dev.env .env.local
npm install
```

### Step 3 — Start Working

Run the services locally while you develop:

```bash
# Terminal 1 — Start database
docker-compose up -d

# Terminal 2 — Backend (auto-reloads on save)
cd backend
npm run start:dev

# Terminal 3 — Frontend (auto-reloads on save)
cd frontend
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

### Step 4 — Build Before Committing

Always verify the build passes before pushing. A broken build blocks everyone.

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm run build
```

Fix any build errors before moving to the next step.

### Step 5 — Commit and Push

Stage only the files you intentionally changed. Never use `git add .` blindly.

```bash
git add frontend/app/...          # add specific files
git add backend/src/...

git commit -m "feat: short description of what you did"
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub and request a review from the team lead.

### Commit Message Convention

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Config, deps, tooling |
| `refactor:` | Code restructure (no behaviour change) |
| `docs:` | Documentation only |

### Rules

- Never push directly to `main` — always use a branch + PR
- Never commit `.env` files or secrets
- Always pull before starting work
- Build must pass before pushing
- Get PR approval before merging

---

## Live Services

| Service | URL |
|---------|-----|
| Backend API | https://pulse-production-9a76.up.railway.app |
| Health Check | https://pulse-production-9a76.up.railway.app/health |

---

## Demo Credentials

| Username | Password | Role | Clearance |
|----------|----------|------|-----------|
| `admin` | `Demo123!` | Admin | SECRET |
| `maj.harris` | `Demo123!` | Army Medical Officer | SECRET |
| `cpt.rodriguez` | `Demo123!` | Army Medical Officer | CONFIDENTIAL |
| `lt.chen` | `Demo123!` | Army Medical Officer | UNCLASSIFIED |
| `dr.williams` | `Demo123!` | Public Medical Official | UNCLASSIFIED |
| `dr.patel` | `Demo123!` | Public Medical Official | UNCLASSIFIED |

---

## Project Structure

```
pulse/
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── auth/               # JWT auth, MFA, guards
│   │   ├── users/              # User management
│   │   ├── medical/            # Cases, files
│   │   ├── ai/                 # Gemini AI + BioMistral
│   │   ├── chat/               # WebSocket chat
│   │   ├── audit/              # Tamper-evident audit log
│   │   ├── demo/               # Demo data seeding
│   │   ├── diagnoses/          # Diagnosis records
│   │   ├── patients/           # Patient management
│   │   ├── doctors/            # Doctor profiles
│   │   ├── reports/            # Report generation
│   │   ├── documents/          # Encrypted document storage + AI analysis
│   │   └── symptoms/           # Symptom tracking
│   └── railway.json
├── frontend/                   # Next.js 14 + Capacitor + Tauri
│   ├── app/                    # App Router pages
│   ├── android/                # Android Capacitor project
│   ├── src-tauri/              # Tauri desktop shell
│   ├── components/             # UI components
│   ├── lib/                    # API client, auth, store
│   ├── env/                    # Environment presets
│   ├── scripts/                # Build helpers
│   └── capacitor.config.ts
├── docs/                       # Platform build guides
│   ├── SETUP_ANDROID.md
│   ├── SETUP_DESKTOP.md
│   ├── RELEASE_GUIDE.md
│   └── TESTING_CHECKLIST.md
└── docker-compose.yml
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| Docker | Latest |

---

## Platform Builds

### Prerequisites Summary

| Platform | Required Tools |
|----------|---------------|
| Android | Node 20+, Java 21, Android SDK (API 36) |
| Desktop (Windows) | Node 20+, Rust 1.70+, VS Build Tools 2022 |
| Desktop (macOS) | Node 20+, Rust 1.70+, Xcode 14+ |
| iOS | macOS only, Xcode 14+, CocoaPods |

---

## Android Build

### Step 1 — Install Java 21

Capacitor 8.x requires **Java 21**.

**Windows (PowerShell as Admin):**
```powershell
winget install Microsoft.OpenJDK.21
```

Verify:
```cmd
java -version
# Should show: openjdk version "21..."
```

### Step 2 — Install Android SDK

1. Install [Android Studio](https://developer.android.com/studio)
2. SDK Manager → install **Android 15 (API 36)** platform
3. SDK Manager → SDK Tools → install Build-Tools 36.x

Set environment variables:
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
```

### Step 3 — Configure Signing Keystore

The keystore is at `frontend/android/keystore/pulselogic-release.jks`.
`frontend/android/keystore.properties` holds the passwords (already configured — do not commit).

### Step 4 — Build Frontend (static export)

```cmd
cd frontend
copy .env.mobile .env.local
set MOBILE_BUILD=true
npx next build
```

### Step 5 — Sync to Android

```cmd
npx cap sync android
```

### Step 6 — Build Release APK

```cmd
cd android
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.7.6-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
gradlew.bat assembleRelease
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

### Step 6b — Build AAB (Google Play)

```cmd
gradlew.bat bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

### Android Troubleshooting

| Error | Fix |
|-------|-----|
| `invalid source release: 21` | Install JDK 21; Capacitor 8 requires it |
| `ANDROID_HOME not set` | Add SDK path to system environment |
| `generateStaticParams missing` | Return `[{ id: 'index' }]` not `[]` |
| `pages-manifest.json not found` | `pages/404.tsx` exists to force manifest generation |
| Cleartext HTTP blocked | Check `network_security_config.xml` |
| Gradle sync fails | Run `npx cap sync android` then retry |

---

## Desktop Build (Tauri)

### Step 1 — Install Rust

**Windows:**
```powershell
winget install Rustlang.Rustup
```

Install VS Build Tools 2022 with "Desktop development with C++" workload.

**macOS:**
```bash
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Step 2 — Generate App Icons

```bash
cd frontend
npx @tauri-apps/cli icon public/icon.svg
```

### Step 3 — Build Desktop App

```bash
cd frontend
cp .env.desktop .env.local    # Windows: copy .env.desktop .env.local
npx tauri build
```

**Windows output:**
```
src-tauri/target/release/bundle/nsis/PulseLogic_1.0.0_x64-setup.exe
src-tauri/target/release/bundle/msi/PulseLogic_1.0.0_x64_en-US.msi
```

**macOS output:**
```
src-tauri/target/release/bundle/dmg/PulseLogic_1.0.0_aarch64.dmg
```

### Step 4 — Development Mode

```bash
cd frontend
npx tauri dev
```

### Desktop Troubleshooting

| Error | Fix |
|-------|-----|
| `cargo build` fails | `rustup update` |
| Missing MSVC linker | Install VS Build Tools → C++ workload |
| WebView2 not found | Install from Microsoft WebView2 page |
| Window blank | Check CSP in `tauri.conf.json` allows API URLs |
| macOS signing error | Set `signingIdentity` in `tauri.conf.json` |

---

## iOS Build

> **Requires macOS with Xcode 15+.** Cannot be built on Windows or Linux.

```bash
cd frontend
npx cap add ios
cd ios/App && pod install
cd ../..
cp .env.mobile .env.local
MOBILE_BUILD=true npx next build
npx cap sync ios
npx cap open ios
```

In Xcode: select signing team → set bundle ID `com.military.pulselogic` → Build (⌘B).

### iOS Troubleshooting

| Error | Fix |
|-------|-----|
| `pod install` fails | `sudo gem install cocoapods` then retry |
| Signing error | Set team in Xcode → Signing & Capabilities |
| White screen | Check API URL is HTTPS in `.env.mobile` |

---

## Version Management

```bash
cd frontend
node scripts/bump-version.js patch    # 1.0.0 → 1.0.1
node scripts/bump-version.js minor    # 1.0.0 → 1.1.0
node scripts/bump-version.js major    # 1.0.0 → 2.0.0
```

Updates: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `android/app/build.gradle`

---

## CI/CD (GitHub Actions)

Pushing a `v*` tag triggers automated builds:

| Workflow | Trigger | Produces |
|----------|---------|---------|
| `android-build.yml` | `v*` tag or manual | APK + AAB |
| `desktop-build.yml` | `v*` tag or manual | .exe, .msi, .dmg |

### Release Workflow

```bash
cd frontend
node scripts/bump-version.js patch
git add -A
git commit -m "chore: bump version to v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias (`pulselogic`) |
| `ANDROID_KEY_PASSWORD` | Key password |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri updater signing key |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Key password |

---

## Backend Deployment (Railway)

```bash
cd backend
railway up
```

### Required Environment Variables

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<random-32-char-string>
JWT_REFRESH_SECRET=<random-32-char-string>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
DB_SSL=true
GEMINI_API_KEY=<your-gemini-key>
MFA_APP_NAME=PulseLogic
NEXTAUTH_SECRET=<random-32-char-string>
```

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/refresh` | Bearer | Refresh token |
| GET | `/api/auth/profile` | Bearer | Get profile |
| POST | `/api/auth/mfa/verify` | Bearer | Verify TOTP |

### Medical Cases
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/medical/cases` | Bearer | List cases |
| POST | `/api/medical/cases` | Bearer | Create case |
| GET | `/api/medical/cases/:id` | Bearer | Case detail |
| PATCH | `/api/medical/cases/:id` | Bearer | Update case |
| POST | `/api/medical/cases/:id/close` | Bearer | Close case |

### Documents
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/documents/upload` | Bearer | Upload document (50MB max) |
| GET | `/api/documents` | Bearer | List documents |
| GET | `/api/documents/:id` | Bearer | Document detail |
| GET | `/api/documents/:id/file` | Bearer | Download decrypted file |
| POST | `/api/documents/:id/analyze` | Bearer | Run AI analysis |
| DELETE | `/api/documents/:id` | Bearer | Delete document |

### AI Services
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/analyze-symptoms` | Bearer | Symptom analysis |
| POST | `/api/ai/analyze-ecg` | Bearer | ECG interpretation |
| POST | `/api/ai/query-protocol` | Bearer | Protocol query |
| POST | `/api/ai/chat` | Bearer | AI chat |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List users |
| PATCH | `/api/users/:id` | Admin | Update role/clearance |
| GET | `/api/audit/logs` | Admin | All audit logs |
| GET | `/api/audit/verify` | Admin | Integrity check |
| POST | `/api/demo/seed` | Admin | Seed demo data |
| POST | `/api/demo/reset` | Admin | Reset demo data |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | NestJS 10 |
| Database | PostgreSQL (TypeORM) |
| Auth | JWT + bcrypt + speakeasy TOTP |
| Real-time | Socket.io WebSockets |
| AI | Google Gemini + BioMistral + Llama Vision |
| Frontend | Next.js 14 (App Router) |
| Mobile | Capacitor 8 (Android + iOS) |
| Desktop | Tauri 2 (Windows + macOS + Linux) |
| Styling | Tailwind CSS |
| State | Zustand |
| Deployment | Railway (backend), GitHub Releases (apps) |

---

## Known Build Quirks (Resolved)

| Issue | Root Cause | Fix Applied |
|-------|-----------|-------------|
| `generateStaticParams missing` for `cases/[id]` | Next.js 14.1 treats empty array as "missing" | Return `[{ id: 'index' }]` |
| `pages-manifest.json not found` | Pure App Router skips Pages Router compilation | Added `pages/404.tsx` |
| `useSession must be wrapped in SessionProvider` crash on mobile | `SessionProvider` skipped for mobile builds | Always included with `session=null` |
| Desktop app window blank | `output: 'export'` not activated for Tauri | `.env.desktop` sets `NEXT_PUBLIC_MOBILE_BUILD=true` |
| ECG analyze fails with CORS error | axios `withCredentials` blocks Capacitor origin | ECG page uses `fetch()` with explicit `Authorization` header |

---

## Disclaimers

> **MVP Notice:** This is a demonstration MVP. Not for production clinical use without
> proper security audit, compliance certification (HIPAA/FHIR), and legal review.

> **AI Disclaimer:** AI features provide decision support only — not diagnosis.
> All outputs must be reviewed by qualified medical personnel.

## License

UNLICENSED — Proprietary software. All rights reserved.

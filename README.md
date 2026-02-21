# PulseLogic — Secure Military Medical Decision Support

A secure, multi-platform medical decision-support system with role-based access control,
clearance-level gating, AI-powered diagnostics, and offline-capable mobile/desktop clients.

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

## Local Development

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| Docker | Latest |
| npm | 10+ |

### Backend

```bash
cd backend
cp .env.example .env          # fill in secrets
docker-compose up -d           # start PostgreSQL + Redis
npm install
npm run start:dev
```

API available at `http://localhost:3001`

### Frontend (web)

```bash
cd frontend
cp env/dev.env .env.local
npm install
npm run dev
```

App available at `http://localhost:3000`

---

## Platform Builds

### Prerequisites Summary

| Platform | Required Tools |
|----------|---------------|
| Android | Node 20+, **Java 21**, Android SDK (API 36) |
| Desktop (Windows) | Node 20+, Rust 1.70+, VS Build Tools 2022 |
| Desktop (macOS) | Node 20+, Rust 1.70+, Xcode 14+ |
| iOS | macOS only, Xcode 14+, CocoaPods |

---

## Android Build

### Step 1 — Install Java 21

Capacitor 8.x requires **Java 21** (hardcoded in the library).

**Windows (PowerShell as Admin):**
```powershell
winget install Microsoft.OpenJDK.21
```

Verify:
```cmd
java -version
# Should show: openjdk version "21..."
```

If `winget` installs to a different path, find it with:
```cmd
dir "C:\Program Files\Microsoft\" | findstr jdk
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

:: Copy mobile environment
copy .env.mobile .env.local

:: Build Next.js static export
set MOBILE_BUILD=true
npx next build
```

> **Fix applied:** `generateStaticParams` must return at least one entry in Next.js 14.1
> (an empty array is treated as "missing" by the build checker).

### Step 5 — Sync to Android

```cmd
npx cap sync android
```

### Step 6 — Build Release APK

```cmd
cd android

:: Set Java 21 (adjust path to match your installation)
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

### Gradle Toolchain Auto-Download

`android/settings.gradle` includes the **Foojay Toolchain Resolver**.
If Gradle cannot find JDK 21 locally, it will download it automatically
(requires internet on first run). Controlled by:

```properties
# android/gradle.properties
org.gradle.toolchain.download.enabled=true
org.gradle.java.installations.auto-download=true
```

### Android Troubleshooting

| Error | Fix |
|-------|-----|
| `invalid source release: 21` | Install JDK 21; Capacitor 8 requires it |
| `ANDROID_HOME not set` | Add SDK path to system environment |
| `generateStaticParams missing` | Return `[{ id: 'index' }]` not `[]` — fixed in codebase |
| `pages-manifest.json not found` | `pages/404.tsx` now exists to force manifest generation |
| Cleartext HTTP blocked | Check `network_security_config.xml` |
| Gradle sync fails | Run `npx cap sync android` then retry |

---

## Desktop Build (Tauri)

### Step 1 — Install Rust

**Windows:**
```powershell
winget install Rustlang.Rustup
# Or download from https://rustup.rs
```

Install VS Build Tools 2022 with "Desktop development with C++" workload.

**macOS:**
```bash
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Verify:
```bash
rustc --version   # 1.70+
cargo --version
```

### Step 2 — Generate App Icons

```bash
cd frontend
# Uses public/icon.svg as source (512x512 shield + pulse logo)
npx @tauri-apps/cli icon public/icon.svg
```

This generates all required sizes in `src-tauri/icons/`.

### Step 3 — Build Desktop App

```bash
cd frontend

# Copy desktop environment
cp .env.desktop .env.local    # Windows: copy .env.desktop .env.local

# Build (produces native installer for current platform)
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
# Opens native window with hot-reload pointing to localhost:3000
```

### Desktop Tauri Architecture

```
src-tauri/
├── Cargo.toml          # Rust dependencies (tauri 2, plugins)
├── tauri.conf.json     # Window config, CSP, bundle settings
├── build.rs            # Build script
├── icons/              # App icons (generated by tauri icon)
└── src/
    └── main.rs         # Entry point + get_app_version command
```

**Security settings in `tauri.conf.json`:**
- `contentProtected: true` — prevents screenshots
- CSP restricts connections to known backend URLs only
- DevTools open only in debug builds (`#[cfg(debug_assertions)]`)

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
> Full guide: [`docs/SETUP_IOS.md`](docs/SETUP_IOS.md)
> CI workflow: [`.github/workflows/ios-build.yml`](.github/workflows/ios-build.yml)

### Step 1 — Add iOS Platform

```bash
cd frontend
npx cap add ios
```

### Step 2 — Install CocoaPods Dependencies

```bash
cd ios/App
pod install
```

### Step 3 — Build Frontend

```bash
cd frontend
cp .env.mobile .env.local
MOBILE_BUILD=true npx next build
npx cap sync ios
```

### Step 4 — Open in Xcode

```bash
npx cap open ios
```

In Xcode:
1. Select your signing team (requires Apple Developer account)
2. Set bundle ID: `com.military.pulselogic`
3. Select target device or simulator
4. Product → Build (⌘B) or Run (⌘R)

### Step 5 — Archive for App Store / Ad Hoc

1. Product → Archive
2. Distribute App → choose method (App Store / Ad Hoc / Enterprise)
3. Export `.ipa`

### iOS Configuration (`capacitor.config.ts`)

```typescript
ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scrollEnabled: true,
}
```

### iOS Troubleshooting

| Error | Fix |
|-------|-----|
| `pod install` fails | `sudo gem install cocoapods` then retry |
| Signing error | Set team in Xcode → Signing & Capabilities |
| App Transport Security | Check `Info.plist` ATS config |
| White screen | Check API URL is HTTPS in `.env.mobile` |

---

## Version Management

All platform versions sync from a single script:

```bash
cd frontend

# Preview (no changes)
node scripts/bump-version.js patch --dry-run

# Apply
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
# 1. Bump version
cd frontend
node scripts/bump-version.js patch

# 2. Commit and tag
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

Encode keystore for CI:
```bash
# macOS/Linux
base64 -i android/keystore/pulselogic-release.jks | pbcopy

# Windows
certutil -encode android\keystore\pulselogic-release.jks encoded.txt
```

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
| AI | Google Gemini + BioMistral |
| Frontend | Next.js 14 (App Router, Static Export) |
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
| `pages-manifest.json not found` | Pure App Router skips Pages Router server compilation | Added `pages/404.tsx` to force manifest generation |
| `useParams()` null | Next.js 14 strict null types | Added `params?.id ?? ''` guard |
| `useSearchParams()` null | Same as above | Added `searchParams?.get()` guard |
| `usePathname()` null | Same as above | Added `pathname ?? ''` guard |
| `generateStaticParams` in `route.ts` | Invalid in route handlers; caused build confusion | Replaced with valid catch-all params |
| Desktop app window blank / doesn't open | `output: 'export'` not activated for Tauri (needs `NEXT_PUBLIC_MOBILE_BUILD=true`) | `.env.desktop` sets flag; `next.config.js` checks both `MOBILE_BUILD` and `NEXT_PUBLIC_MOBILE_BUILD` |
| `useSession must be wrapped in SessionProvider` crash on mobile | `SessionProvider` was skipped for mobile builds | `providers.tsx` now always includes `SessionProvider` with `session=null` + no refetch |
| ECG analyze fails with CORS error | `api.ts` uses `withCredentials: true`; Capacitor origin blocked | ECG page uses `fetch()` with explicit `Authorization` header instead of axios |

---

## Disclaimers

> **MVP Notice:** This is a demonstration MVP. Not for production clinical use without
> proper security audit, compliance certification (HIPAA/FHIR), and legal review.

> **AI Disclaimer:** AI features provide decision support only — not diagnosis.
> All outputs must be reviewed by qualified medical personnel.

## License

UNLICENSED — Proprietary software. All rights reserved.

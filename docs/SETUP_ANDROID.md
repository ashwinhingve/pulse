# Android Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Java JDK | 17 | [Adoptium](https://adoptium.net) |
| Android Studio | Latest | [developer.android.com](https://developer.android.com/studio) |
| Android SDK | API 36 | Via Android Studio SDK Manager |

## First-Time Setup

### 1. Install Android Studio

Download and install Android Studio. During setup, ensure these are checked:
- Android SDK
- Android SDK Platform-Tools
- Android Virtual Device (AVD)

### 2. Configure SDK

Open Android Studio → **Settings** → **Languages & Frameworks** → **Android SDK**:
- **SDK Platforms**: Install **Android 14 (API 36)**
- **SDK Tools**: Install:
  - Android SDK Build-Tools
  - Android SDK Command-line Tools
  - Android Emulator

### 3. Set Environment Variables

Add to your system PATH:
```powershell
# Windows (PowerShell profile)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"
```

### 4. Install Dependencies

```bash
cd frontend
npm install
```

### 5. Create Emulator

Android Studio → **Device Manager** → **Create Virtual Device**:
- Phone: Pixel 7
- System Image: API 36 (arm64 or x86_64)

## Development Workflow

### Live Reload (Recommended)

```bash
npm run android:dev
```

This will:
1. Switch to mobile environment
2. Build Next.js static export
3. Sync with Capacitor
4. Open Android Studio

Then click ▶ **Run** in Android Studio.

### Manual Build

```bash
# 1. Set environment
npm run env:mobile

# 2. Build frontend
npx cross-env MOBILE_BUILD=true next build

# 3. Sync to Android project
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

## Release Build

### Generate Keystore (First Time Only)

```bash
keytool -genkey -v -keystore keystore/pulselogic-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias pulselogic
```

### Configure Signing

```bash
# Copy the example and fill in your values
cp android/keystore.properties.example android/keystore.properties
```

### Build APK

```bash
npm run android:build    # Build frontend + sync
npm run android:apk      # Generate signed APK
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Build AAB (Google Play)

```bash
npm run android:build
npm run android:aab
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ANDROID_HOME not set` | Set env var to SDK location |
| `SDK not found` | Install via Android Studio SDK Manager |
| Emulator won't start | Enable VT-x/AMD-V in BIOS |
| Build fails on sync | Run `npx cap sync android` manually |
| Cleartext blocked | Check `network_security_config.xml` |

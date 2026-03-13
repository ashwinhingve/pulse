# iOS Development Setup

> **macOS required.** All steps below must be run on a Mac.
> The Capacitor iOS platform cannot be built on Windows or Linux.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| macOS | 13+ (Ventura) | — |
| Xcode | 15+ | App Store |
| CocoaPods | 1.14+ | `sudo gem install cocoapods` |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Apple Developer Account | — | [developer.apple.com](https://developer.apple.com) |

---

## First-Time Setup (Mac)

### 1. Install Xcode CLI Tools

```bash
xcode-select --install
```

### 2. Install CocoaPods

```bash
sudo gem install cocoapods
```

### 3. Install Node Dependencies

```bash
cd frontend
npm install
```

### 4. Add iOS Platform

```bash
npx cap add ios
```

This creates `frontend/ios/` with the full Xcode project.

### 5. Install CocoaPods Dependencies

```bash
cd ios/App
pod install
```

---

## Development Workflow

### Build Frontend + Sync

```bash
cd frontend

# Set mobile environment
cp .env.mobile .env.local

# Build static export
MOBILE_BUILD=true npx next build

# Sync to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### Live Reload (Dev Mode)

```bash
# Start Next.js dev server
npm run dev

# In a second terminal, sync with live-reload URL
CAPACITOR_ENV=development npx cap sync ios
npx cap open ios
```

In `capacitor.config.ts`, set the `server.url` for dev:
```typescript
server: {
    url: 'http://localhost:3000',
    cleartext: true,
}
```

---

## iOS Configuration

The iOS config lives in `capacitor.config.ts`:

```typescript
ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scrollEnabled: true,
}
```

**Key `Info.plist` entries** (Xcode → App target → Info tab):

| Key | Value | Reason |
|-----|-------|--------|
| `NSFaceIDUsageDescription` | "Used for secure login" | Biometric auth |
| `NSCameraUsageDescription` | "Used to scan documents" | File uploads |
| App Transport Security | HTTPS only | Security |

---

## Release Build

### 1. Configure Signing in Xcode

1. Open `frontend/ios/App/App.xcworkspace`
2. Select the **App** target → **Signing & Capabilities**
3. Set **Team** to your Apple Developer account
4. Bundle ID: `com.military.pulselogic`
5. Enable **Automatically manage signing**

### 2. Archive

1. Set scheme to **Any iOS Device (arm64)**
2. **Product → Archive**
3. Organizer opens automatically

### 3. Distribute

| Method | Use Case |
|--------|---------|
| **App Store Connect** | Public App Store release |
| **Ad Hoc** | Direct install on registered devices |
| **Enterprise** | Internal distribution |
| **Development** | Testing on team devices |

---

## Build for Release IPA (Command Line)

```bash
# Archive
xcodebuild \
  -workspace frontend/ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination generic/platform=iOS \
  -archivePath /tmp/PulseLogic.xcarchive \
  archive

# Export IPA
xcodebuild \
  -exportArchive \
  -archivePath /tmp/PulseLogic.xcarchive \
  -exportOptionsPlist frontend/ios/ExportOptions.plist \
  -exportPath /tmp/PulseLogic-ipa
```

### ExportOptions.plist

Create `frontend/ios/ExportOptions.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>ad-hoc</string>           <!-- or app-store / enterprise -->
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>thinning</key>
    <string>&lt;none&gt;</string>
</dict>
</plist>
```

---

## Splash Screen & Icons

Icons are already generated in `src-tauri/icons/` for Tauri.
Capacitor uses its own icon set. Generate with:

```bash
# From frontend/
npx @capacitor/assets generate \
  --iconBackgroundColor '#0f172a' \
  --iconBackgroundColorDark '#0f172a' \
  --splashBackgroundColor '#0f172a' \
  --splashBackgroundColorDark '#0f172a'
```

Place a 1024×1024 `assets/icon.png` and `assets/splash.png` in `frontend/`.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `pod install` fails | `sudo gem install cocoapods && pod repo update` |
| Signing error | Check team ID in Signing & Capabilities |
| White screen on device | Verify `NEXT_PUBLIC_API_URL` is HTTPS in `.env.mobile` |
| `NSFaceIDUsageDescription` missing | Add to `Info.plist` via Xcode |
| App rejected (HTTP) | All API calls must use HTTPS in production |
| `xcworkspace` not found | Run `pod install` first — it generates the workspace |
| Capacitor plugin missing | Run `npx cap sync ios` after `npm install` |

---

## CI/CD

iOS builds are automated in `.github/workflows/ios-build.yml`.
Triggered on `v*` tags — runs on `macos-latest`.

### Required GitHub Secrets (iOS)

| Secret | Purpose |
|--------|---------|
| `MATCH_PASSWORD` | Fastlane Match encryption password |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for App Store upload |

For signing without Fastlane, set `CODE_SIGNING_ALLOWED=NO` for unsigned development builds.

# Release & Distribution Guide

## Version Management

All platform versions are synced via a single command:

```bash
# Bump patch version (1.0.0 → 1.0.1)
node scripts/bump-version.js patch

# Bump minor version (1.0.0 → 1.1.0)
node scripts/bump-version.js minor

# Bump major version (1.0.0 → 2.0.0)
node scripts/bump-version.js major

# Dry run (preview without changes)
node scripts/bump-version.js patch --dry-run
```

This updates: `package.json`, `tauri.conf.json`, `Cargo.toml`, `build.gradle`

## Release Workflow

### 1. Prepare Release

```bash
# Ensure clean working tree
git status

# Bump version
node scripts/bump-version.js patch

# Commit and tag
git add -A
git commit -m "chore: bump version to v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### 2. Automated Builds (CI/CD)

Pushing a `v*` tag triggers GitHub Actions:

| Workflow | Produces | Location |
|----------|----------|----------|
| `android-build.yml` | APK + AAB | GitHub Release assets |
| `desktop-build.yml` | .exe, .msi, .dmg | GitHub Release assets |

### 3. Manual Builds

#### Android APK
```bash
cd frontend
npm run env:mobile
npm run android:build
npm run android:apk
```

#### Android AAB (Google Play)
```bash
npm run android:aab
```

#### Windows Desktop
```bash
npm run desktop:build
```

#### macOS Desktop
```bash
# Must run on a Mac
npm run desktop:build
```

## Distribution

### Android — Google Play

1. Build AAB: `npm run android:aab`
2. Go to [Google Play Console](https://play.google.com/console)
3. Upload AAB to Internal Testing → Closed Testing → Production
4. Fill in listing details, screenshots, privacy policy

### Android — Direct APK

1. Build APK: `npm run android:apk`
2. Share `app-release.apk` via secure channel
3. Users enable "Install from Unknown Sources"

### Windows

1. Build: `npm run desktop:build`
2. Distribute the `.exe` (NSIS installer) or `.msi`
3. Users may see SmartScreen warning until you get an EV code signing cert

### macOS

1. Build on Mac: `npm run desktop:build`
2. Distribute the `.dmg`
3. For Gatekeeper approval: sign with Apple Developer ID + notarize

## GitHub Secrets Required

| Secret | Purpose |
|--------|---------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded release keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias (e.g., `pulselogic`) |
| `ANDROID_KEY_PASSWORD` | Key password |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri updater signing key |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Key password |

### Encoding keystore for CI:
```bash
base64 -i keystore/pulselogic-release.jks | pbcopy  # macOS
# or
certutil -encode keystore/pulselogic-release.jks encoded.txt  # Windows
```

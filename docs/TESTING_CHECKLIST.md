# Pre-Release Testing Checklist

Use this checklist before every release. Check each item on each target platform.

---

## All Platforms

### Authentication
- [ ] Login with valid credentials → redirects to dashboard
- [ ] Login with wrong credentials → shows error message
- [ ] Session persists after page/app restart
- [ ] Logout clears session completely
- [ ] Token refresh works (stay logged in > 15 min)

### Core Features
- [ ] Dashboard loads with stats
- [ ] Patient list loads and paginates
- [ ] Patient detail page shows all sections
- [ ] Search works across patients
- [ ] Forms submit without errors
- [ ] Navigation between all major pages works

### Network & Resilience
- [ ] API calls succeed with valid token
- [ ] Graceful error display on server errors (500)
- [ ] Offline: shows connection lost notification
- [ ] Reconnect: queued requests replay
- [ ] WebSocket reconnects after disconnect

---

## Android (Capacitor)

### Device Testing
- [ ] Installs cleanly from APK
- [ ] Splash screen shows PulseLogic branding
- [ ] Status bar styled correctly (dark, #0f172a)
- [ ] Keyboard doesn't overlap input fields
- [ ] Back button navigates correctly (doesn't exit on first press)
- [ ] App survives rotation (portrait ↔ landscape)
- [ ] App resumes correctly after backgrounding

### Security
- [ ] HTTPS-only in release build (no cleartext)
- [ ] App content hidden in task switcher
- [ ] No sensitive data in Android logs (release)

### Performance
- [ ] Cold start < 3 seconds
- [ ] Smooth scrolling on patient lists
- [ ] No memory leaks after extended use (monitor in Android Studio)

---

## Windows Desktop (Tauri)

### Installation
- [ ] NSIS installer runs without errors
- [ ] App appears in Start Menu
- [ ] Uninstaller works cleanly

### Window Behavior
- [ ] Opens centered at 1280x800
- [ ] Respects minimum size (800x600)
- [ ] Resizing is smooth, no layout breaks
- [ ] Maximizing/restoring works
- [ ] Content protected (screenshots show black)

### Security
- [ ] CSP blocks unexpected network requests
- [ ] No DevTools in release build

### Performance
- [ ] App starts < 2 seconds
- [ ] Memory usage < 200MB at idle
- [ ] No excessive CPU when idle

---

## macOS Desktop (Tauri)

### Installation
- [ ] DMG mounts and app drags to Applications
- [ ] First launch passes Gatekeeper (if signed)
- [ ] App appears in Dock and cmd+tab

### Window Behavior
- [ ] Native macOS title bar works
- [ ] Full screen mode works (green button)
- [ ] Trackpad gestures don't break navigation

### Security
- [ ] Same CSP checks as Windows
- [ ] Content protection active

---

## Sign-Off

| Platform | Tester | Date | Status |
|----------|--------|------|--------|
| Android | | | ☐ Pass / ☐ Fail |
| Windows | | | ☐ Pass / ☐ Fail |
| macOS | | | ☐ Pass / ☐ Fail |
